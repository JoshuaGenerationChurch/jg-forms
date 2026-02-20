<?php

test('home redirects to forms index', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect(route('forms.index'));
});
