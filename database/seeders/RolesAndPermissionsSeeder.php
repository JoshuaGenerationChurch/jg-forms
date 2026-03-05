<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'forms.admin.access',
            'invitations.manage',
        ];

        foreach ($permissions as $permissionName) {
            Permission::query()->firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        $superAdminRole = Role::query()->firstOrCreate([
            'name' => 'super-admin',
            'guard_name' => 'web',
        ]);
        $formsAdminRole = Role::query()->firstOrCreate([
            'name' => 'forms-admin',
            'guard_name' => 'web',
        ]);
        Role::query()->firstOrCreate([
            'name' => 'requester',
            'guard_name' => 'web',
        ]);

        $superAdminRole->syncPermissions($permissions);
        $formsAdminRole->syncPermissions([
            'forms.admin.access',
            'invitations.manage',
        ]);
    }
}
