<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\CompanySettingController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Announcements\AnnouncementController;
use App\Http\Controllers\Crm\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Finance\InvoiceController;
use App\Http\Controllers\Marketing\CampaignController;
use App\Http\Controllers\Marketing\LeadController;
use App\Http\Controllers\Notifications\UserNotificationController;
use App\Http\Controllers\Operations\ShipmentController;
use App\Http\Controllers\Approvals\ApprovalsController;
use App\Http\Controllers\Leave\LeaveRequestController;
use App\Http\Controllers\Procurement\PurchaseRequestController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Reports\EmployeeReportController;
use App\Http\Controllers\Sales\PipelineController;
use App\Http\Controllers\Sales\QuotationController;
use App\Http\Controllers\Support\SupportTicketController;
use App\Http\Controllers\Tasks\TaskController;
use App\Http\Controllers\Warehouse\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/approvals', [ApprovalsController::class, 'index'])->name('approvals.index');

    Route::get('/notifications', [UserNotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [UserNotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('/notifications/{userNotification}/read', [UserNotificationController::class, 'markRead'])->name('notifications.read');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::middleware('permission:users.view')->group(function () {
            Route::get('/users', [UserController::class, 'index'])->name('users.index');
        });
        Route::middleware('permission:users.create')->group(function () {
            Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
            Route::post('/users', [UserController::class, 'store'])->name('users.store');
        });
        Route::middleware('permission:users.update')->group(function () {
            Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
            Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::patch('/users/{user}/toggle-active', [UserController::class, 'toggleActive'])->name('users.toggle-active');
        });

        Route::middleware('permission:roles.view')->group(function () {
            Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        });
        Route::middleware('permission:roles.manage')->group(function () {
            Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
            Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        });

        Route::middleware('permission:departments.manage')->group(function () {
            Route::get('/departments', [DepartmentController::class, 'index'])->name('departments.index');
            Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
            Route::put('/departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');
            Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');
        });

        Route::middleware('permission:branches.manage')->group(function () {
            Route::get('/branches', [BranchController::class, 'index'])->name('branches.index');
            Route::post('/branches', [BranchController::class, 'store'])->name('branches.store');
            Route::put('/branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
            Route::delete('/branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');
        });

        Route::middleware('permission:settings.manage')->group(function () {
            Route::get('/settings', [CompanySettingController::class, 'edit'])->name('settings.edit');
            Route::put('/settings', [CompanySettingController::class, 'update'])->name('settings.update');
        });

        Route::middleware('permission:audit.view')->group(function () {
            Route::get('/audit-logs', [ActivityLogController::class, 'index'])->name('audit-logs.index');
        });
    });

    Route::prefix('crm')->name('crm.')->group(function () {
        Route::middleware('permission:customers.create')->group(function () {
            Route::get('/customers/create', [CustomerController::class, 'create'])->name('customers.create');
            Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
        });
        Route::middleware('permission:customers.view')->group(function () {
            Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
            Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
        });
        Route::middleware('permission:customers.update')->group(function () {
            Route::get('/customers/{customer}/edit', [CustomerController::class, 'edit'])->name('customers.edit');
            Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        });
        Route::middleware('permission:customers.delete')->group(function () {
            Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
        });
    });

    Route::prefix('sales')->name('sales.')->group(function () {
        Route::middleware('permission:quotations.create')->group(function () {
            Route::get('/quotations/create', [QuotationController::class, 'create'])->name('quotations.create');
            Route::post('/quotations', [QuotationController::class, 'store'])->name('quotations.store');
        });
        Route::middleware('permission:quotations.view')->group(function () {
            Route::get('/quotations', [QuotationController::class, 'index'])->name('quotations.index');
            Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');
        });
        Route::middleware('permission:quotations.update')->group(function () {
            Route::get('/quotations/{quotation}/edit', [QuotationController::class, 'edit'])->name('quotations.edit');
            Route::put('/quotations/{quotation}', [QuotationController::class, 'update'])->name('quotations.update');
            Route::post('/quotations/{quotation}/submit', [QuotationController::class, 'submit'])->name('quotations.submit');
        });
        Route::middleware('permission:quotations.approve')->group(function () {
            Route::post('/quotations/{quotation}/approve', [QuotationController::class, 'approve'])->name('quotations.approve');
        });
        Route::middleware('permission:quotations.reject')->group(function () {
            Route::post('/quotations/{quotation}/reject', [QuotationController::class, 'reject'])->name('quotations.reject');
        });
        Route::middleware('permission:quotations.convert')->group(function () {
            Route::post('/quotations/{quotation}/convert', [QuotationController::class, 'convert'])->name('quotations.convert');
        });
        Route::middleware('permission:invoices.manage')->group(function () {
            Route::post('/quotations/{quotation}/invoice', [InvoiceController::class, 'fromQuotation'])->name('quotations.invoice');
        });
    });

    Route::prefix('pipeline')->name('pipeline.')->group(function () {
        Route::middleware('permission:pipeline.manage')->group(function () {
            Route::get('/create', [PipelineController::class, 'create'])->name('create');
            Route::post('/', [PipelineController::class, 'store'])->name('store');
        });

        Route::middleware('permission:pipeline.view|pipeline.view_all|pipeline.manage')->group(function () {
            Route::get('/', [PipelineController::class, 'index'])->name('index');
            Route::get('/{opportunity}', [PipelineController::class, 'show'])->name('show');
        });

        Route::middleware('permission:pipeline.manage|pipeline.view_all')->group(function () {
            Route::get('/{opportunity}/edit', [PipelineController::class, 'edit'])->name('edit');
            Route::put('/{opportunity}', [PipelineController::class, 'update'])->name('update');
            Route::post('/{opportunity}/stage', [PipelineController::class, 'stage'])->name('stage');
        });
    });

    Route::prefix('operations')->name('operations.')->group(function () {
        Route::middleware('permission:shipments.create')->group(function () {
            Route::get('/shipments/create', [ShipmentController::class, 'create'])->name('shipments.create');
            Route::post('/shipments', [ShipmentController::class, 'store'])->name('shipments.store');
        });
        Route::middleware('permission:shipments.view')->group(function () {
            Route::get('/shipments', [ShipmentController::class, 'index'])->name('shipments.index');
            Route::get('/shipments/{shipment}', [ShipmentController::class, 'show'])->name('shipments.show');
        });
        Route::middleware('permission:shipments.update')->group(function () {
            Route::get('/shipments/{shipment}/edit', [ShipmentController::class, 'edit'])->name('shipments.edit');
            Route::put('/shipments/{shipment}', [ShipmentController::class, 'update'])->name('shipments.update');
            Route::post('/shipments/{shipment}/advance', [ShipmentController::class, 'advance'])->name('shipments.advance');
        });
    });

    Route::prefix('warehouse')->name('warehouse.')->middleware('permission:warehouse.view')->group(function () {
        Route::get('/', [WarehouseController::class, 'index'])->name('index');
        Route::middleware('permission:warehouse.manage')->group(function () {
            Route::post('/items', [WarehouseController::class, 'storeItem'])->name('items.store');
            Route::post('/movements', [WarehouseController::class, 'storeMovement'])->name('movements.store');
        });
    });

    Route::prefix('reports')->name('reports.')->group(function () {
        Route::middleware('permission:reports.weekly.submit')->group(function () {
            Route::get('/create', [EmployeeReportController::class, 'create'])->name('create');
            Route::post('/', [EmployeeReportController::class, 'store'])->name('store');
        });

        Route::middleware('permission:reports.weekly.submit|reports.view_all|reports.weekly.review')->group(function () {
            Route::get('/', [EmployeeReportController::class, 'index'])->name('index');
            Route::get('/{report}', [EmployeeReportController::class, 'show'])->name('show');
        });

        Route::middleware('permission:reports.weekly.submit')->group(function () {
            Route::get('/{report}/edit', [EmployeeReportController::class, 'edit'])->name('edit');
            Route::put('/{report}', [EmployeeReportController::class, 'update'])->name('update');
            Route::post('/{report}/submit', [EmployeeReportController::class, 'submit'])->name('submit');
        });

        Route::middleware('permission:reports.weekly.review')->group(function () {
            Route::post('/{report}/review', [EmployeeReportController::class, 'review'])->name('review');
        });
    });

    Route::prefix('support')->name('support.')->middleware('permission:support.view')->group(function () {
        Route::get('/', [SupportTicketController::class, 'index'])->name('index');
        Route::get('/create', [SupportTicketController::class, 'create'])->name('create');
        Route::post('/', [SupportTicketController::class, 'store'])->name('store');
        Route::get('/{ticket}', [SupportTicketController::class, 'show'])->name('show');
        Route::post('/{ticket}/reply', [SupportTicketController::class, 'reply'])->name('reply');
        Route::middleware('permission:support.manage')->group(function () {
            Route::put('/{ticket}', [SupportTicketController::class, 'update'])->name('update');
        });
    });

    Route::prefix('finance')->name('finance.')->group(function () {
        Route::middleware('permission:invoices.manage')->group(function () {
            Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
            Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        });

        Route::middleware('permission:invoices.view')->group(function () {
            Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
            Route::get('/invoices/{invoice}/print', [InvoiceController::class, 'print'])->name('invoices.print');
        });

        Route::middleware('permission:invoices.manage')->group(function () {
            Route::get('/invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
            Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
            Route::post('/invoices/{invoice}/status', [InvoiceController::class, 'markStatus'])->name('invoices.status');
        });
    });

    Route::prefix('tasks')->name('tasks.')->group(function () {
        Route::middleware('permission:tasks.create|tasks.manage')->group(function () {
            Route::get('/create', [TaskController::class, 'create'])->name('create');
            Route::post('/', [TaskController::class, 'store'])->name('store');
        });

        Route::middleware('permission:tasks.view|tasks.manage')->group(function () {
            Route::get('/', [TaskController::class, 'index'])->name('index');
            Route::get('/{task}', [TaskController::class, 'show'])->name('show');
        });

        Route::middleware('permission:tasks.create|tasks.manage')->group(function () {
            Route::get('/{task}/edit', [TaskController::class, 'edit'])->name('edit');
            Route::put('/{task}', [TaskController::class, 'update'])->name('update');
            Route::post('/{task}/status', [TaskController::class, 'status'])->name('status');
            Route::post('/{task}/comment', [TaskController::class, 'comment'])->name('comment');
        });
    });

    Route::prefix('announcements')->name('announcements.')->group(function () {
        // All employees (non-customer) can read; managers publish.
        Route::middleware('permission:announcements.manage')->group(function () {
            Route::get('/create', [AnnouncementController::class, 'create'])->name('create');
            Route::post('/', [AnnouncementController::class, 'store'])->name('store');
        });

        Route::get('/', [AnnouncementController::class, 'index'])->name('index');
        Route::get('/{announcement}', [AnnouncementController::class, 'show'])->name('show');
        Route::post('/{announcement}/read', [AnnouncementController::class, 'markRead'])->name('read');

        Route::middleware('permission:announcements.manage')->group(function () {
            Route::get('/{announcement}/edit', [AnnouncementController::class, 'edit'])->name('edit');
            Route::put('/{announcement}', [AnnouncementController::class, 'update'])->name('update');
        });
    });

    Route::prefix('procurement')->name('procurement.')->group(function () {
        Route::get('/create', [PurchaseRequestController::class, 'create'])->name('create');
        Route::post('/', [PurchaseRequestController::class, 'store'])->name('store');
        Route::get('/', [PurchaseRequestController::class, 'index'])->name('index');
        Route::get('/{purchaseRequest}', [PurchaseRequestController::class, 'show'])->name('show');
        Route::get('/{purchaseRequest}/edit', [PurchaseRequestController::class, 'edit'])->name('edit');
        Route::put('/{purchaseRequest}', [PurchaseRequestController::class, 'update'])->name('update');
        Route::post('/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve'])->name('approve');
        Route::post('/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject'])->name('reject');
        Route::post('/{purchaseRequest}/process', [PurchaseRequestController::class, 'process'])->name('process');
        Route::post('/{purchaseRequest}/cancel', [PurchaseRequestController::class, 'cancel'])->name('cancel');
    });

    Route::prefix('leave')->name('leave.')->group(function () {
        Route::get('/calendar', [LeaveRequestController::class, 'calendar'])->name('calendar');
        Route::get('/create', [LeaveRequestController::class, 'create'])->name('create');
        Route::post('/', [LeaveRequestController::class, 'store'])->name('store');
        Route::get('/', [LeaveRequestController::class, 'index'])->name('index');
        Route::get('/{leaveRequest}', [LeaveRequestController::class, 'show'])->name('show');
        Route::get('/{leaveRequest}/edit', [LeaveRequestController::class, 'edit'])->name('edit');
        Route::put('/{leaveRequest}', [LeaveRequestController::class, 'update'])->name('update');
        Route::post('/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])->name('approve');
        Route::post('/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])->name('reject');
        Route::post('/{leaveRequest}/cancel', [LeaveRequestController::class, 'cancel'])->name('cancel');
    });

    Route::prefix('marketing')->name('marketing.')->middleware('permission:marketing.view')->group(function () {
        Route::middleware('permission:marketing.manage')->group(function () {
            Route::get('/campaigns/create', [CampaignController::class, 'create'])->name('campaigns.create');
            Route::post('/campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
            Route::get('/leads/create', [LeadController::class, 'create'])->name('leads.create');
            Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');
        });

        Route::get('/campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
        Route::get('/leads', [LeadController::class, 'index'])->name('leads.index');
        Route::get('/campaigns/{campaign}', [CampaignController::class, 'show'])->name('campaigns.show');

        Route::middleware('permission:marketing.manage')->group(function () {
            Route::get('/campaigns/{campaign}/edit', [CampaignController::class, 'edit'])->name('campaigns.edit');
            Route::put('/campaigns/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
            Route::get('/leads/{lead}/edit', [LeadController::class, 'edit'])->name('leads.edit');
            Route::put('/leads/{lead}', [LeadController::class, 'update'])->name('leads.update');
        });
    });
});

require __DIR__.'/auth.php';
