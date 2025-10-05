using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        protected readonly IUnitOfWork _uow;
        protected readonly ICodeGenerator _codeGen;
        protected readonly IMapper _mapper;

        protected BaseApiController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper)
        {
            _uow = uow;
            _codeGen = codeGen;
            _mapper = mapper;
        }
    }
}
