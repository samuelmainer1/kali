<?php
/**
 * Forwards /admin/api and /uploads to the Node app on this server.
 * The app crashes with "Internal Server Error" when it sees
 * new.globeflight.co.ke, so every forwarded call uses the main site address.
 */

$forward = isset($_GET['gf_forward']) ? (string) $_GET['gf_forward'] : '';
$forward = str_replace(["\r", "\n", "\0"], '', $forward);

if (!preg_match('#^(admin/api/|uploads/)#', $forward) || strpos($forward, '..') !== false) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo '{"message":"Not found"}';
    exit;
}

$params = $_GET;
unset($params['gf_forward']);
$query = http_build_query($params);
$url = 'http://127.0.0.1:5000/' . $forward;
if ($query !== '') {
    $url .= '?' . $query;
}

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
$body = file_get_contents('php://input');
if ($body === false) {
    $body = '';
}

$incoming = function_exists('getallheaders') ? getallheaders() : array();
if (!is_array($incoming)) {
    $incoming = array();
}

$skip = array(
    'host' => true,
    'connection' => true,
    'content-length' => true,
    'origin' => true,
    'accept-encoding' => true,
    'transfer-encoding' => true,
    'keep-alive' => true,
    'upgrade' => true,
    'proxy-connection' => true,
    'te' => true,
    'trailer' => true,
    'x-forwarded-for' => true,
    'x-real-ip' => true,
);

$headers = array(
    'Origin: https://globeflight.co.ke',
);
$sawAuthorization = false;
foreach ($incoming as $name => $value) {
    $lower = strtolower($name);
    if (isset($skip[$lower])) {
        continue;
    }
    if ($lower === 'authorization') {
        $sawAuthorization = true;
    }
    $headers[] = $name . ': ' . $value;
}

if (!$sawAuthorization && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $headers[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
} elseif (!$sawAuthorization && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $headers[] = 'Authorization: ' . $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

$clientIp = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
$clientIp = str_replace(array("\r", "\n", "\0"), '', $clientIp);
if ($clientIp !== '') {
    $headers[] = 'X-Forwarded-For: ' . $clientIp;
    $headers[] = 'X-Real-IP: ' . $clientIp;
}

if (!function_exists('curl_init')) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo '{"message":"The site server cannot reach the API."}';
    exit;
}

$ch = curl_init($url);
$options = array(
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_TIMEOUT => 90,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
);
if ($method === 'GET') {
    $options[CURLOPT_HTTPGET] = true;
} elseif ($method !== 'HEAD') {
    $options[CURLOPT_POSTFIELDS] = $body;
}
curl_setopt_array($ch, $options);

$raw = curl_exec($ch);
if ($raw === false) {
    curl_close($ch);
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo '{"message":"The site server could not reach the API."}';
    exit;
}

$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($raw, 0, $headerSize);
$rawBody = substr($raw, $headerSize);

http_response_code($status > 0 ? $status : 502);
$skipOut = array(
    'transfer-encoding' => true,
    'connection' => true,
    'keep-alive' => true,
    'content-length' => true,
    'content-encoding' => true,
);
foreach (preg_split("/\r\n|\n|\r/", $rawHeaders) as $line) {
    if (strpos($line, ':') === false) {
        continue;
    }
    $parts = explode(':', $line, 2);
    $name = strtolower(trim($parts[0]));
    if (isset($skipOut[$name])) {
        continue;
    }
    header($parts[0] . ':' . $parts[1], false);
}

echo $rawBody;
