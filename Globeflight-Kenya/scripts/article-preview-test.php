<?php
/**
 * Checks that an article link is given that article's hero image.
 * Run: php scripts/article-preview-test.php
 */

require __DIR__ . '/../gf-article.php';

$failures = 0;

function check($label, $condition) {
    global $failures;
    if ($condition) {
        echo "ok  $label\n";
        return;
    }
    $failures++;
    echo "FAIL $label\n";
}

$shell = <<<'HTML'
<!doctype html>
<html><head>
<title data-rh="true">Importer of Record (IOR) Services Kenya | Globeflight Worldwide Express</title>
<meta property="og:image" content="https://globeflight.co.ke/logo-og.png" data-rh="true" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="https://globeflight.co.ke/logo-og.png" data-rh="true" />
<meta property="og:url" content="https://globeflight.co.ke/" data-rh="true" />
<link rel="canonical" href="https://globeflight.co.ke/" data-rh="true" />
</head><body>
<noscript id="gf-seo-summary"><h1>Home</h1><p>Home page</p></noscript>
<div id="root"></div>
</body></html>
HTML;

$slug = 'kra-makes-digital-marine-cargo-insurance-mandatory-from-november-1-2026-what-every-kenyan-importer-needs-to-know';
$post = array(
    'title' => 'KRA Makes Digital Marine Cargo Insurance Mandatory from November 1, 2026: What Every Kenyan Importer Needs to Know',
    'slug' => $slug,
    'shortDescription' => "Learn about KRA's mandatory Digital Marine Cargo Insurance.",
    'featuredImage' => 'https://res.cloudinary.com/dpjop4z2b/image/upload/v1793255425/blogs/oerimulsjvgfmhane97i.png',
    'isPublished' => true,
);

$html = gf_apply_article_meta($shell, $post, $slug);
check('hero replaces the logo', strpos($html, 'logo-og.png') === false);
check(
    'link uses the same Cloudinary photo',
    strpos($html, 'https://res.cloudinary.com/dpjop4z2b/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1793255425/blogs/oerimulsjvgfmhane97i.png') !== false
);
check('width tag is left alone', strpos($html, 'property="og:image:width" content="1200"') !== false);
check('canonical is the article', strpos($html, 'https://globeflight.co.ke/blog/' . $slug) !== false);
check('title is the article', strpos($html, 'KRA Makes Digital Marine Cargo Insurance Mandatory') !== false);
check('preview size is a shareable jpeg', strpos($html, 'f_jpg,q_auto') !== false);

$upload = gf_apply_article_meta($shell, array(
    'title' => 'Advance cargo',
    'featuredImage' => '/uploads/1787738889484-photo.png',
), 'advance-cargo');
check('uploaded hero stays on this site', strpos($upload, 'content="https://globeflight.co.ke/uploads/1787738889484-photo.png"') !== false);

$liveShell = '/tmp/kra.html';
if (is_file($liveShell)) {
    putenv('GF_ARTICLE_API=https://globeflight.co.ke/admin/api');
    $live = gf_fetch_post($slug);
    check('live article can be read', is_array($live) && !empty($live['featuredImage']));
    if (is_array($live)) {
        $rendered = gf_apply_article_meta(file_get_contents($liveShell), $live, $slug);
        check('live page no longer points at the logo', strpos($rendered, 'logo-og.png') === false);
        check('live page points at the saved hero', strpos($rendered, 'oerimulsjvgfmhane97i') !== false);
        check('homepage address is gone', strpos($rendered, 'content="https://globeflight.co.ke/" data-rh="true"') === false);
    }
}

exit($failures === 0 ? 0 : 1);
