<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('customer_id')->constrained()->nullOnDelete();
            $table->string('current_location')->nullable()->after('destination_country');
            $table->unsignedInteger('pieces')->default(1)->after('current_location');
            $table->decimal('weight_kg', 12, 2)->nullable()->after('pieces');
            $table->string('tracking_number')->nullable()->unique()->after('weight_kg');
            $table->date('expected_departure')->nullable()->after('tracking_number');
            $table->date('expected_arrival')->nullable()->after('expected_departure');
            $table->timestamp('delivered_at')->nullable()->after('expected_arrival');
        });

        Schema::create('shipment_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('quantity_on_hand', 12, 2)->default(0);
            $table->string('unit')->default('pcs');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shipment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('location_code')->nullable();
            $table->string('status')->default('available')->index();
            $table->timestamps();
        });

        Schema::create('cargo_movements', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->foreignId('inventory_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shipment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('performed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('moved_at');
            $table->timestamps();

            $table->index(['type', 'moved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cargo_movements');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('shipment_status_histories');

        Schema::table('shipments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
            $table->dropColumn([
                'current_location',
                'pieces',
                'weight_kg',
                'tracking_number',
                'expected_departure',
                'expected_arrival',
                'delivered_at',
            ]);
        });
    }
};
