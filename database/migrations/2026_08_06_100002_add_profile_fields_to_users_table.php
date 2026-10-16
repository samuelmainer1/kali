<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('employee_code')->nullable()->unique()->after('phone');
            $table->foreignId('department_id')->nullable()->after('employee_code')->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->after('department_id')->constrained()->nullOnDelete();
            $table->boolean('is_active')->default(true)->after('branch_id');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('avatar_path')->nullable()->after('last_login_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropConstrainedForeignId('branch_id');
            $table->dropColumn([
                'phone',
                'employee_code',
                'is_active',
                'last_login_at',
                'avatar_path',
            ]);
        });
    }
};
