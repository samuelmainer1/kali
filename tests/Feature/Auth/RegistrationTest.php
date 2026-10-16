<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

/**
 * Public registration is disabled — administrators provision accounts.
 */
class RegistrationTest extends TestCase
{
    public function test_registration_routes_are_disabled(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();
    }
}
