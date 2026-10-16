<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $settings->company_name }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0B1220; font-size: 13px; }
        h1 { font-size: 22px; margin-bottom: 0; }
        p.tag { color: #1A5C2E; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
        th { width: 30%; color: #475569; font-weight: 600; }
    </style>
</head>
<body>
    <h1>{{ $settings->company_name }}</h1>
    <p class="tag">{{ $settings->trading_name }} · {{ $settings->currency }} · {{ $settings->timezone }}</p>
    <table>
        <tr><th>Email</th><td>{{ $settings->email }}</td></tr>
        <tr><th>Phone</th><td>{{ $settings->phone }}</td></tr>
        <tr><th>Website</th><td>{{ $settings->website }}</td></tr>
        <tr><th>Address</th><td>{{ $settings->address }}</td></tr>
    </table>
</body>
</html>
