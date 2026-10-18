<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('departments')->where('code', 'MKT')->update([
            'name' => 'IT & Marketing',
            'description' => 'IT support, brand, and growth',
        ]);

        DB::table('users')->where('email', 'marketing@globeflight.co.ke')->update([
            'name' => 'IT & Marketing Officer',
        ]);

        Schema::create('it_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('category');
            $table->string('priority')->default('medium');
            $table->string('status')->default('open')->index();
            $table->string('title');
            $table->text('description');
            $table->text('resolution')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::findOrCreate('it.request');
        Permission::findOrCreate('it.manage');

        $requestRoles = [
            'administrator', 'management', 'sales', 'operations', 'warehouse',
            'finance', 'customer_care', 'marketing',
        ];

        foreach ($requestRoles as $name) {
            $role = Role::query()->where('name', $name)->first();
            $role?->givePermissionTo('it.request');
        }

        foreach (['administrator', 'management', 'marketing'] as $name) {
            $role = Role::query()->where('name', $name)->first();
            $role?->givePermissionTo('it.manage');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('it_requests');

        DB::table('departments')->where('code', 'MKT')->update([
            'name' => 'Marketing',
            'description' => 'Brand and growth',
        ]);

        DB::table('users')->where('email', 'marketing@globeflight.co.ke')->update([
            'name' => 'Marketing Officer',
        ]);
    }
};
