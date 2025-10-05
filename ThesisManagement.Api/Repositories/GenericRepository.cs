using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using ThesisManagement.Api.Data;

namespace ThesisManagement.Api.Repositories
{
    public class GenericRepository<TEntity> : IGenericRepository<TEntity> where TEntity : class
    {
        protected readonly ApplicationDbContext _db;
        protected readonly DbSet<TEntity> _dbSet;

        public GenericRepository(ApplicationDbContext db)
        {
            _db = db;
            _dbSet = db.Set<TEntity>();
        }

        public async Task AddAsync(TEntity entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        public async Task<(IEnumerable<TEntity> Items, int TotalCount)> GetPagedAsync(int page = 1, int pageSize = 10, Expression<Func<TEntity, bool>>? filter = null)
        {
            var query = _dbSet.AsQueryable();
            if (filter != null) query = query.Where(filter);
            var total = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return (items, total);
        }

        public async Task<(IEnumerable<TEntity> Items, int TotalCount)> GetPagedWithFilterAsync<TFilter>(int page, int pageSize, TFilter filter, Func<IQueryable<TEntity>, TFilter, IQueryable<TEntity>> applyFilter)
        {
            var query = _dbSet.AsQueryable();
            query = applyFilter(query, filter);
            var totalCount = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return (items, totalCount);
        }

        public IQueryable<TEntity> Query() => _dbSet.AsQueryable();

        public async Task<TEntity?> GetByIdAsync(params object[] keyValues)
        {
            return await _dbSet.FindAsync(keyValues);
        }

        public async Task<TEntity?> GetByCodeAsync(string code)
        {
            // Use reflection to find Code property
            var codeProperty = typeof(TEntity).GetProperties()
                .FirstOrDefault(p => p.Name.EndsWith("Code") && p.PropertyType == typeof(string));
            
            if (codeProperty == null)
                throw new InvalidOperationException($"Entity {typeof(TEntity).Name} does not have a Code property");

            var parameter = Expression.Parameter(typeof(TEntity), "x");
            var property = Expression.Property(parameter, codeProperty.Name);
            var constant = Expression.Constant(code);
            var equal = Expression.Equal(property, constant);
            var lambda = Expression.Lambda<Func<TEntity, bool>>(equal, parameter);

            return await _dbSet.FirstOrDefaultAsync(lambda);
        }

        public void Update(TEntity entity)
        {
            _dbSet.Update(entity);
        }

        public void Remove(TEntity entity)
        {
            _dbSet.Remove(entity);
        }

        public async Task RemoveByIdAsync(params object[] keyValues)
        {
            var entity = await GetByIdAsync(keyValues);
            if (entity != null)
            {
                Remove(entity);
            }
        }

        public async Task<int> CountAsync(Expression<Func<TEntity, bool>>? filter = null)
        {
            var query = _dbSet.AsQueryable();
            if (filter != null) query = query.Where(filter);
            return await query.CountAsync();
        }

        public async Task<bool> ExistsAsync(params object[] keyValues)
        {
            var entity = await GetByIdAsync(keyValues);
            return entity != null;
        }
    }
}
