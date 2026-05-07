<?php

class RateLimiter {

    private string $cacheDir;

    public function __construct() {
        $this->cacheDir = __DIR__ . '/rate_cache/';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0750, true);
        }
    }

    private function getIp(): string {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        // Take first IP from X-Forwarded-For chain
        $ip = trim(explode(',', $ip)[0]);
        return preg_replace('/[^a-fA-F0-9.:_-]/', '_', $ip);
    }

    private function getCacheFile(string $action, string $ip): string {
        return $this->cacheDir . md5($action . '_' . $ip) . '.json';
    }

    /**
     * Check and record a hit. Returns ['allowed' => bool, 'retry_after' => int].
     *
     * @param string $action      Identifier (new_incident, login, vote)
     * @param int    $maxHits     Maximum allowed hits in the window
     * @param int    $windowSecs  Window length in seconds
     * @param int    $blockSecs   How long to block after exceeding (0 = use window)
     */
    public function check(string $action, int $maxHits, int $windowSecs, int $blockSecs = 0): array {
        $ip = $this->getIp();
        $file = $this->getCacheFile($action, $ip);
        $now  = time();

        $data = ['hits' => [], 'blocked_until' => 0];

        if (file_exists($file)) {
            $raw = @file_get_contents($file);
            if ($raw) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) $data = $decoded;
            }
        }

        // Check if currently blocked
        if ($data['blocked_until'] > $now) {
            $retryAfter = $data['blocked_until'] - $now;
            return ['allowed' => false, 'retry_after' => $retryAfter];
        }

        // Remove hits outside the current window
        $data['hits'] = array_filter($data['hits'], fn($t) => $t > ($now - $windowSecs));
        $data['hits'] = array_values($data['hits']);

        if (count($data['hits']) >= $maxHits) {
            // Too many hits — apply block
            $block = $blockSecs > 0 ? $blockSecs : $windowSecs;
            $data['blocked_until'] = $now + $block;
            @file_put_contents($file, json_encode($data), LOCK_EX);
            return ['allowed' => false, 'retry_after' => $block];
        }

        // Record this hit
        $data['hits'][] = $now;
        @file_put_contents($file, json_encode($data), LOCK_EX);

        return ['allowed' => true, 'retry_after' => 0];
    }

    /**
     * Enforce a rate limit; sends HTTP 429 and exits if exceeded.
     */
    public function enforce(string $action, int $maxHits, int $windowSecs, int $blockSecs = 0): void {
        $result = $this->check($action, $maxHits, $windowSecs, $blockSecs);
        if (!$result['allowed']) {
            http_response_code(429);
            $minutes = (int) ceil($result['retry_after'] / 60);
            echo json_encode([
                "status"      => "error",
                "message"     => "Massa sol·licituds. Torna a intentar-ho en {$minutes} minuts.",
                "retry_after" => $result['retry_after']
            ]);
            exit;
        }
    }

    /** Periodically purge stale cache files (1 in 20 chance). */
    public function cleanup(): void {
        if (rand(1, 20) !== 1) return;
        $now = time();
        foreach (glob($this->cacheDir . '*.json') as $file) {
            $raw = @file_get_contents($file);
            if (!$raw) { @unlink($file); continue; }
            $data = json_decode($raw, true);
            if (!is_array($data)) { @unlink($file); continue; }
            $latestHit  = !empty($data['hits']) ? max($data['hits']) : 0;
            $blockedEnd = $data['blocked_until'] ?? 0;
            if ($latestHit < $now - 7200 && $blockedEnd < $now) {
                @unlink($file);
            }
        }
    }
}
