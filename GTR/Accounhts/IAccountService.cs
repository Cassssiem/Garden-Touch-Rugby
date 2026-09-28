using GTR.Application.Accounts.Dtos;

namespace GTR.Application.Accounts
{
    public interface IAccountService
    {
        Task<AccountResponse> CreatePlayerAccountAsync(
            CreatePlayerAccountRequest request,
            CancellationToken cancellationToken = default);
    }
}