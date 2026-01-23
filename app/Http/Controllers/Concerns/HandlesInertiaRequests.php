<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

trait HandlesInertiaRequests
{
    /**
     * Determine if the request is a DataTables AJAX request.
     */
    protected function isDataTablesRequest(Request $request): bool
    {
        return $request->ajax() && $request->has('draw') && ! $request->inertia();
    }

    /**
     * Redirect with error message, handling both Inertia and non-Inertia requests.
     *
     * This method properly handles error redirects for both Inertia DELETE/POST requests
     * and traditional form submissions, preventing 303 redirect issues.
     *
     * @param  string  $routeName  The route name to redirect to
     * @param  string  $errorMessage  The error message to display
     * @param  array  $routeParams  Optional route parameters (e.g., ['tab' => 'all', 'page' => 1])
     */
    protected function redirectWithError(
        Request $request,
        string $routeName,
        string $errorMessage,
        array $routeParams = []
    ): RedirectResponse {
        if ($request->inertia()) {
            return redirect()
                ->route($routeName, array_merge($routeParams, $request->only(['tab', 'search', 'subject_id', 'page'])))
                ->with('error', $errorMessage);
        }

        return back()->withErrors(['message' => $errorMessage])->withInput();
    }

    /**
     * Redirect with error, automatically choosing between show page or index.
     *
     * If the request came from a show/edit page, redirects back to that page.
     * Otherwise, redirects to the index page. Handles both Inertia and non-Inertia requests.
     *
     * @param  string  $indexRoute  The index route name (e.g., 'admin.questions.index')
     * @param  string  $showRoute  The show route name (e.g., 'admin.questions.show')
     * @param  int|string  $resourceId  The resource ID for the show route
     * @param  string  $errorMessage  The error message to display
     * @param  callable|null  $shouldRedirectBack  Optional callback to determine if should redirect back (receives $request, $resourceId)
     */
    protected function redirectWithErrorToResource(
        Request $request,
        string $indexRoute,
        string $showRoute,
        int|string $resourceId,
        string $errorMessage,
        ?callable $shouldRedirectBack = null
    ): RedirectResponse {
        if ($request->inertia()) {
            $shouldGoBack = $shouldRedirectBack
                ? $shouldRedirectBack($request, $resourceId)
                : $this->defaultShouldRedirectBack($request, $resourceId);

            if ($shouldGoBack) {
                return redirect()
                    ->route($showRoute, $resourceId)
                    ->with('error', $errorMessage);
            }

            return $this->redirectWithError($request, $indexRoute, $errorMessage);
        }

        return back()->withErrors(['message' => $errorMessage])->withInput();
    }

    /**
     * Default logic to determine if should redirect back to show page.
     * Checks if the referer URL contains the show/edit route pattern.
     */
    protected function defaultShouldRedirectBack(Request $request, int|string $resourceId): bool
    {
        $referer = $request->header('referer');
        if (! $referer) {
            return false;
        }

        // Check if referer contains /show or /edit pattern
        return str_contains($referer, '/show') || str_contains($referer, '/edit');
    }
}
