<?php

namespace App\Http\Controllers;

use App\Exports\UserDirectoryExport;
use App\Models\CompanySetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class DocumentController extends Controller
{
    /**
     * Company profile PDF, stored on the documents disk and downloaded.
     */
    public function companyProfile(): Response
    {
        $settings = CompanySetting::current();
        $binary = Pdf::loadView('documents.company-profile', [
            'settings' => $settings,
        ])->output();

        Storage::disk(config('filesystems.documents_disk'))->put('company/profile.pdf', $binary);

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="globeflight-company-profile.pdf"',
        ]);
    }

    /**
     * Staff directory spreadsheet. Passwords and tokens are not included.
     */
    public function userDirectory(): Response
    {
        $disk = config('filesystems.documents_disk');
        $path = 'exports/user-directory.xlsx';

        Excel::store(new UserDirectoryExport, $path, $disk);

        return Storage::disk($disk)->download($path, 'globeflight-staff.xlsx');
    }
}
