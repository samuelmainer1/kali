<?php
/**
 * Puts a published article's hero image on the link itself.
 *
 * Articles saved after the site was built have no HTML file of their own.
 * WhatsApp and Facebook read that file before the page runs, so they were
 * seeing the homepage logo. This script reads the live article and writes
 * its picture into the page before it is sent.
 */

function gf_esc($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function gf_plain($value) {
    $text = html_entity_decode(strip_tags((string) $value), ENT_QUOTES, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text);
    $text = trim($text);
    if (function_exists('mb_strlen') && mb_strlen($text, 'UTF-8') > 300) {
        return rtrim(mb_substr($text, 0, 297, 'UTF-8')) . '...';
    }
    if (strlen($text) > 300) {
        return rtrim(substr($text, 0, 297)) . '...';
    }
    return $text;
}

function gf_preview_image($imagePath) {
    $imagePath = trim((string) $imagePath);
    if ($imagePath === '' || $imagePath === 'null' || $imagePath === 'undefined') {
        return 'https://globeflight.co.ke/logo-og.png';
    }

    if (stripos($imagePath, 'http://') !== 0 && stripos($imagePath, 'https://') !== 0) {
        if ($imagePath[0] !== '/') {
            $imagePath = '/' . $imagePath;
        }
        $imagePath = 'https://globeflight.co.ke' . $imagePath;
    }

    $optimized = preg_replace(
        '#^(https?://res\.cloudinary\.com/[^/]+/image/upload/)#i',
        '$1c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/',
        $imagePath,
        1,
        $count
    );
    if ($count === 1) {
        return $optimized;
    }
    return $imagePath;
}

function gf_set_title($html, $title) {
    $tag = '<title data-rh="true">' . gf_esc($title) . '</title>';
    if (preg_match('/<title\b[\s\S]*?<\/title>/i', $html)) {
        return preg_replace('/<title\b[\s\S]*?<\/title>/i', $tag, $html, 1);
    }
    return str_replace('</head>', '    ' . $tag . "\n  </head>", $html);
}

function gf_set_meta($html, $attr, $key, $content) {
    $tag = '<meta ' . $attr . '="' . $key . '" content="' . gf_esc($content) . '" data-rh="true" />';
    $pattern = '/<meta\s+[^>]*\b' . preg_quote($attr, '/') . '=["\']' . preg_quote($key, '/') . '["\'][^>]*>/i';
    if (preg_match($pattern, $html)) {
        return preg_replace($pattern, $tag, $html, 1);
    }
    return str_replace('</head>', '    ' . $tag . "\n  </head>", $html);
}

function gf_set_canonical($html, $href) {
    $tag = '<link rel="canonical" href="' . gf_esc($href) . '" data-rh="true" />';
    $pattern = '/<link\s+[^>]*rel=["\']canonical["\'][^>]*>/i';
    if (preg_match($pattern, $html)) {
        return preg_replace($pattern, $tag, $html, 1);
    }
    return str_replace('</head>', '    ' . $tag . "\n  </head>", $html);
}

function gf_apply_article_meta($html, $post, $slug) {
    $title = '';
    if (!empty($post['metaTitle'])) {
        $title = gf_plain($post['metaTitle']);
    }
    if ($title === '') {
        $title = gf_plain(isset($post['title']) ? $post['title'] : 'Globeflight Kenya Blog');
        if ($title !== '' && stripos($title, 'Globeflight') === false) {
            $title .= ' | Globeflight Kenya Blog';
        }
    }

    if (!empty($post['metaDescription'])) {
        $description = gf_plain($post['metaDescription']);
    } elseif (!empty($post['shortDescription'])) {
        $description = gf_plain($post['shortDescription']);
    } else {
        $description = gf_plain(isset($post['title']) ? $post['title'] : $title);
    }

    $image = gf_preview_image(isset($post['featuredImage']) ? $post['featuredImage'] : '');
    $canonical = 'https://globeflight.co.ke/blog/' . $slug;

    $html = gf_set_title($html, $title);
    $html = gf_set_meta($html, 'name', 'title', $title);
    $html = gf_set_meta($html, 'name', 'description', $description);
    $html = gf_set_meta($html, 'property', 'og:type', 'article');
    $html = gf_set_meta($html, 'property', 'og:title', $title);
    $html = gf_set_meta($html, 'property', 'og:description', $description);
    $html = gf_set_meta($html, 'property', 'og:url', $canonical);
    $html = gf_set_meta($html, 'property', 'og:image', $image);
    $html = gf_set_meta($html, 'name', 'twitter:card', 'summary_large_image');
    $html = gf_set_meta($html, 'name', 'twitter:title', $title);
    $html = gf_set_meta($html, 'name', 'twitter:description', $description);
    $html = gf_set_meta($html, 'name', 'twitter:url', $canonical);
    $html = gf_set_meta($html, 'name', 'twitter:image', $image);
    $html = gf_set_canonical($html, $canonical);

    $summary = '<noscript id="gf-seo-summary"><h1>' . gf_esc($title) . '</h1><p>' . gf_esc($description) . '</p></noscript>';
    if (strpos($html, 'id="gf-seo-summary"') !== false) {
        $html = preg_replace('/<noscript id="gf-seo-summary">[\s\S]*?<\/noscript>/', $summary, $html, 1);
    }

    return $html;
}

function gf_article_api_base() {
    $base = getenv('GF_ARTICLE_API');
    if (!is_string($base) || trim($base) === '') {
        return 'http://127.0.0.1:5000/admin/api';
    }
    return rtrim(trim($base), '/');
}

function gf_fetch_post($slug) {
    if (!function_exists('curl_init')) {
        return null;
    }

    $url = gf_article_api_base() . '/blogs/public/' . rawurlencode($slug);
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 4,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_HTTPHEADER => array(
            'Accept: application/json',
            'Origin: https://globeflight.co.ke',
        ),
    ));
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($body === false || $code !== 200) {
        return null;
    }

    $json = json_decode($body, true);
    if (!is_array($json) || empty($json['success']) || !isset($json['data']) || !is_array($json['data'])) {
        return null;
    }

    $post = $json['data'];
    if (isset($post['isPublished']) && $post['isPublished'] === false) {
        return null;
    }
    if (!isset($post['slug']) || strtolower((string) $post['slug']) !== strtolower($slug)) {
        return null;
    }
    return $post;
}

if (!isset($_SERVER['SCRIPT_FILENAME']) || realpath((string) $_SERVER['SCRIPT_FILENAME']) !== realpath(__FILE__)) {
    return;
}

$slug = isset($_GET['slug']) ? strtolower(trim((string) $_GET['slug'])) : '';
$index = __DIR__ . '/index.html';
if (!is_file($index)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Article page is unavailable.';
    exit;
}

$html = file_get_contents($index);
if ($html === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Article page is unavailable.';
    exit;
}

if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) && $slug !== 'category') {
    $post = gf_fetch_post($slug);
    if (is_array($post)) {
        $html = gf_apply_article_meta($html, $post, $slug);
    }
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=0');
echo $html;
