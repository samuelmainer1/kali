<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('email', 'management@globeflight.co.ke')->first()
            ?? User::query()->where('email', 'admin@globeflight.co.ke')->first();

        if (! $author) {
            return;
        }

        Announcement::query()->updateOrCreate(
            ['reference' => 'AN-DEMO-0001'],
            [
                'title' => 'Welcome to Globeflight ILMS',
                'body' => "This company-wide announcement is visible to every employee.\n\nUse the bell icon in the header to see unread notices, and open Announcements from the sidebar or dashboard.",
                'type' => 'company',
                'department_id' => null,
                'is_urgent' => true,
                'is_published' => true,
                'published_at' => now()->subMinute(),
                'expires_at' => null,
                'created_by' => $author->id,
            ]
        );

        $opsId = Department::query()->where('code', 'OPS')->value('id');
        if ($opsId) {
            Announcement::query()->updateOrCreate(
                ['reference' => 'AN-DEMO-0002'],
                [
                    'title' => 'Operations department notice',
                    'body' => 'This notice is only for the Operations department. Sales and other departments should not see it.',
                    'type' => 'department',
                    'department_id' => $opsId,
                    'is_urgent' => false,
                    'is_published' => true,
                    'published_at' => now()->subMinute(),
                    'expires_at' => null,
                    'created_by' => $author->id,
                ]
            );
        }
    }
}
