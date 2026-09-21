using GTR.Application.Auth.Dtos;

namespace GTR.Application.Auth
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(
            LoginRequest request,
            CancellationToken cancellationToken = default
        );
    }
}