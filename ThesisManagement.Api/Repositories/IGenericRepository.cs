using System.Linq.Expressions;

namespace ThesisManagement.Api.Repositories
{
    public interface IGenericRepository<TEntity> where TEntity : class
    {
        Task<IEnumerable<TEntity>> GetAllAsync();
        Task<(IEnumerable<TEntity> Items, int TotalCount)> GetPagedAsync(int page = 1, int pageSize = 10, Expression<Func<TEntity, bool>>? filter = null);
        Task<(IEnumerable<TEntity> Items, int TotalCount)> GetPagedWithFilterAsync<TFilter>(int page, int pageSize, TFilter filter, Func<IQueryable<TEntity>, TFilter, IQueryable<TEntity>> applyFilter);
        Task<TEntity?> GetByIdAsync(params object[] keyValues);
        Task<TEntity?> GetByCodeAsync(string code);
        Task AddAsync(TEntity entity);
        void Update(TEntity entity);
        void Remove(TEntity entity);
    Task RemoveByIdAsync(params object[] keyValues);
        IQueryable<TEntity> Query();
    }
}
