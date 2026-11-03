using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace RugbyManagementSystem_Api.Middleware
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Unhandled exception on {Path}", httpContext.Request.Path);

            var (statusCode, title) = MapException(exception);

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = statusCode == StatusCodes.Status500InternalServerError
                    ? "The server could not complete the request."
                    : exception.Message,
                Instance = httpContext.Request.Path
            };

            httpContext.Response.StatusCode = statusCode;
            await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

            return true; // tells ASP.NET Core "handled, don't rethrow"
        }

        private static (int StatusCode, string Title) MapException(Exception exception) =>
            exception switch
            {
                ArgumentException => (StatusCodes.Status400BadRequest, "Invalid request"),
                KeyNotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
                InvalidOperationException => (StatusCodes.Status409Conflict, "Conflict"),
                _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
            };
    }
}
