<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('registration')->unique();
            $table->string('name');
            $table->string('type')->default('van');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->foreignId('driver_id')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->after('driver_id')->constrained()->nullOnDelete();
        });

        Schema::create('proof_of_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('received_by');
            $table->timestamp('received_at');
            $table->text('notes')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('photo_disk')->nullable();
            $table->string('photo_name')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('shipment_customer_notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained()->cascadeOnDelete();
            $table->string('channel');
            $table->string('destination');
            $table->string('status');
            $table->string('subject');
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 14, 2);
            $table->string('method');
            $table->string('reference')->nullable();
            $table->date('paid_on');
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('origin');
            $table->string('destination');
            $table->string('service_type')->default('air');
            $table->decimal('min_weight_kg', 10, 2)->default(0);
            $table->decimal('max_weight_kg', 10, 2)->nullable();
            $table->decimal('price', 14, 2);
            $table->string('currency', 3)->default('KES');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        Permission::findOrCreate('vehicles.view');
        Permission::findOrCreate('vehicles.manage');
        Permission::findOrCreate('rates.view');
        Permission::findOrCreate('rates.manage');

        foreach ([
            'administrator', 'management', 'operations',
        ] as $name) {
            Role::query()->where('name', $name)->first()?->givePermissionTo(['vehicles.view', 'vehicles.manage']);
        }

        Role::query()->where('name', 'warehouse')->first()?->givePermissionTo('vehicles.view');

        foreach (['administrator', 'management', 'sales', 'finance'] as $name) {
            Role::query()->where('name', $name)->first()?->givePermissionTo(['rates.view', 'rates.manage']);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_rates');
        Schema::dropIfExists('invoice_payments');
        Schema::dropIfExists('shipment_customer_notices');
        Schema::dropIfExists('proof_of_deliveries');

        Schema::table('shipments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vehicle_id');
            $table->dropConstrainedForeignId('driver_id');
        });

        Schema::dropIfExists('vehicles');
    }
};
