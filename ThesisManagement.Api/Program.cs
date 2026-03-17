using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Command.Auth;
using ThesisManagement.Api.Application.Command.CommitteeAssignments;
using ThesisManagement.Api.Application.Command.CatalogTopicTags;
using ThesisManagement.Api.Application.Command.CatalogTopics;
using ThesisManagement.Api.Application.Command.ConversationMembers;
using ThesisManagement.Api.Application.Command.Conversations;
using ThesisManagement.Api.Application.Command.DefenseScores;
using ThesisManagement.Api.Application.Command.Departments;
using ThesisManagement.Api.Application.Command.LecturerProfiles;
using ThesisManagement.Api.Application.Command.LecturerTags;
using ThesisManagement.Api.Application.Command.MilestoneTemplates;
using ThesisManagement.Api.Application.Command.MessageAttachments;
using ThesisManagement.Api.Application.Command.MessageReadReceipts;
using ThesisManagement.Api.Application.Command.MessageReactions;
using ThesisManagement.Api.Application.Command.Messages;
using ThesisManagement.Api.Application.Command.ProgressMilestones;
using ThesisManagement.Api.Application.Command.ProgressSubmissions;
using ThesisManagement.Api.Application.Command.Reports;
using ThesisManagement.Api.Application.Command.SubmissionFiles;
using ThesisManagement.Api.Application.Command.StudentProfiles;
using ThesisManagement.Api.Application.Command.Tags;
using ThesisManagement.Api.Application.Command.TopicTags;
using ThesisManagement.Api.Application.Command.TopicLecturers;
using ThesisManagement.Api.Application.Command.Topics;
using ThesisManagement.Api.Application.Command.Users;
using ThesisManagement.Api.Application.Command.Workflows;
using ThesisManagement.Api.Application.Query.CatalogTopicTags;
using ThesisManagement.Api.Application.Query.CatalogTopics;
using ThesisManagement.Api.Application.Query.ConversationMembers;
using ThesisManagement.Api.Application.Query.Conversations;
using ThesisManagement.Api.Application.Query.CommitteeAssignments;
using ThesisManagement.Api.Application.Query.DefenseScores;
using ThesisManagement.Api.Application.Query.Departments;
using ThesisManagement.Api.Application.Query.LecturerProfiles;
using ThesisManagement.Api.Application.Query.LecturerTags;
using ThesisManagement.Api.Application.Query.MilestoneTemplates;
using ThesisManagement.Api.Application.Query.MessageAttachments;
using ThesisManagement.Api.Application.Query.MessageReadReceipts;
using ThesisManagement.Api.Application.Query.MessageReactions;
using ThesisManagement.Api.Application.Query.Messages;
using ThesisManagement.Api.Application.Query.ProgressMilestones;
using ThesisManagement.Api.Application.Query.ProgressSubmissions;
using ThesisManagement.Api.Application.Query.Reports;
using ThesisManagement.Api.Application.Query.SubmissionFiles;
using ThesisManagement.Api.Application.Query.StudentProfiles;
using ThesisManagement.Api.Application.Query.SystemActivityLogs;
using ThesisManagement.Api.Application.Query.Tags;
using ThesisManagement.Api.Application.Query.TopicTags;
using ThesisManagement.Api.Application.Query.TopicLecturers;
using ThesisManagement.Api.Application.Query.Topics;
using ThesisManagement.Api.Application.Query.Users;
using ThesisManagement.Api.Application.Query.Workflows;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Repositories;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.Chat;
using ThesisManagement.Api.Services.DataExchange;
using ThesisManagement.Api.Mappings;
using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Controllers with filters
builder.Services.AddControllers(options =>
{
    // Thêm global filter để log activities
    options.Filters.Add<ThesisManagement.Api.Filters.ActivityLogFilter>();
});
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        // Allow credentials and reflect the incoming Origin header so browsers can send cookies.
        // Note: Don't use AllowAnyOrigin() together with AllowCredentials().
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ThesisManagement API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Input JWT token in format: Bearer {your token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
    // Enable file upload support for multipart/form-data endpoints
    c.OperationFilter<ThesisManagement.Api.Swagger.FileUploadOperationFilter>();
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing in appsettings.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ThesisManagement.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ThesisManagement.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// EF Core
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // SQL Server legacy (đã chuyển sang Oracle):
    // options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.UseOracle(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

// HTTP Context for current user
builder.Services.AddHttpContextAccessor();

// Repositories / Services
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICodeGenerator, CodeGeneratorService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IChatProvisionService, ChatProvisionService>();
builder.Services.AddScoped<ICommitteeAssignmentCommandProcessor, CommitteeAssignmentCommandProcessor>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IDataExchangeService, DataExchangeService>();
builder.Services.AddScoped<ITopicWorkflowCommandSupport, TopicWorkflowCommandSupport>();
builder.Services.AddScoped<IResubmitTopicWorkflowCommandProcessor, ResubmitTopicWorkflowCommandProcessor>();
builder.Services.AddScoped<IDecideTopicWorkflowCommandProcessor, DecideTopicWorkflowCommandProcessor>();
builder.Services.AddScoped<IRollbackStudentWorkflowTestDataCommandProcessor, RollbackStudentWorkflowTestDataCommandProcessor>();
builder.Services.AddScoped<ITopicWorkflowDetailAuditQueryProcessor, TopicWorkflowDetailAuditQueryProcessor>();
builder.Services.AddScoped<ITopicWorkflowTimelineQueryProcessor, TopicWorkflowTimelineQueryProcessor>();
builder.Services.AddScoped<ISubmitTopicWorkflowCommand, SubmitTopicWorkflowCommand>();
builder.Services.AddScoped<IResubmitTopicWorkflowCommand, ResubmitTopicWorkflowCommand>();
builder.Services.AddScoped<IDecideTopicWorkflowCommand, DecideTopicWorkflowCommand>();
builder.Services.AddScoped<IRollbackStudentWorkflowTestDataCommand, RollbackStudentWorkflowTestDataCommand>();
builder.Services.AddScoped<IGetTopicWorkflowDetailQuery, GetTopicWorkflowDetailQuery>();
builder.Services.AddScoped<IGetTopicWorkflowAuditHistoryQuery, GetTopicWorkflowAuditHistoryQuery>();
builder.Services.AddScoped<IGetTopicWorkflowTimelineByTopicIdQuery, GetTopicWorkflowTimelineByTopicIdQuery>();
builder.Services.AddScoped<IGetTopicWorkflowTimelineByTopicCodeQuery, GetTopicWorkflowTimelineByTopicCodeQuery>();
builder.Services.AddScoped<IReportQueryProcessor, ReportQueryProcessor>();
builder.Services.AddScoped<IGetStudentDashboardQuery, GetStudentDashboardQuery>();
builder.Services.AddScoped<IGetStudentProgressHistoryQuery, GetStudentProgressHistoryQuery>();
builder.Services.AddScoped<IGetLecturerSubmissionListQuery, GetLecturerSubmissionListQuery>();
builder.Services.AddScoped<IReportCommandProcessor, ReportCommandProcessor>();
builder.Services.AddScoped<ISubmitStudentProgressReportCommand, SubmitStudentProgressReportCommand>();
builder.Services.AddScoped<IReviewLecturerSubmissionCommand, ReviewLecturerSubmissionCommand>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ILoginCommand, LoginCommand>();
builder.Services.AddScoped<IGetUsersListQuery, GetUsersListQuery>();
builder.Services.AddScoped<IGetUserDetailQuery, GetUserDetailQuery>();
builder.Services.AddScoped<IGetUserCreateQuery, GetUserCreateQuery>();
builder.Services.AddScoped<IGetUserUpdateQuery, GetUserUpdateQuery>();
builder.Services.AddScoped<ICreateUserCommand, CreateUserCommand>();
builder.Services.AddScoped<IUpdateUserCommand, UpdateUserCommand>();
builder.Services.AddScoped<IDeleteUserCommand, DeleteUserCommand>();
builder.Services.AddScoped<IGetDepartmentsListQuery, GetDepartmentsListQuery>();
builder.Services.AddScoped<IGetDepartmentDetailQuery, GetDepartmentDetailQuery>();
builder.Services.AddScoped<IGetDepartmentCreateQuery, GetDepartmentCreateQuery>();
builder.Services.AddScoped<IGetDepartmentUpdateQuery, GetDepartmentUpdateQuery>();
builder.Services.AddScoped<ICreateDepartmentCommand, CreateDepartmentCommand>();
builder.Services.AddScoped<IUpdateDepartmentCommand, UpdateDepartmentCommand>();
builder.Services.AddScoped<IDeleteDepartmentCommand, DeleteDepartmentCommand>();
builder.Services.AddScoped<IGetDefenseScoresListQuery, GetDefenseScoresListQuery>();
builder.Services.AddScoped<IGetDefenseScoreDetailQuery, GetDefenseScoreDetailQuery>();
builder.Services.AddScoped<IGetDefenseScoreCreateQuery, GetDefenseScoreCreateQuery>();
builder.Services.AddScoped<IGetDefenseScoreUpdateQuery, GetDefenseScoreUpdateQuery>();
builder.Services.AddScoped<ICreateDefenseScoreCommand, CreateDefenseScoreCommand>();
builder.Services.AddScoped<IUpdateDefenseScoreCommand, UpdateDefenseScoreCommand>();
builder.Services.AddScoped<IDeleteDefenseScoreCommand, DeleteDefenseScoreCommand>();
builder.Services.AddScoped<IGetTagsListQuery, GetTagsListQuery>();
builder.Services.AddScoped<IGetTagCreateQuery, GetTagCreateQuery>();
builder.Services.AddScoped<IGetTagUpdateQuery, GetTagUpdateQuery>();
builder.Services.AddScoped<IGetTagByCodeQuery, GetTagByCodeQuery>();
builder.Services.AddScoped<IGetTagDetailQuery, GetTagDetailQuery>();
builder.Services.AddScoped<ISearchTagsQuery, SearchTagsQuery>();
builder.Services.AddScoped<ICreateTagCommand, CreateTagCommand>();
builder.Services.AddScoped<IUpdateTagCommand, UpdateTagCommand>();
builder.Services.AddScoped<IDeleteTagCommand, DeleteTagCommand>();
builder.Services.AddScoped<IGetMilestoneTemplatesListQuery, GetMilestoneTemplatesListQuery>();
builder.Services.AddScoped<IGetMilestoneTemplateDetailQuery, GetMilestoneTemplateDetailQuery>();
builder.Services.AddScoped<IGetMilestoneTemplateCreateQuery, GetMilestoneTemplateCreateQuery>();
builder.Services.AddScoped<IGetMilestoneTemplateUpdateQuery, GetMilestoneTemplateUpdateQuery>();
builder.Services.AddScoped<ICreateMilestoneTemplateCommand, CreateMilestoneTemplateCommand>();
builder.Services.AddScoped<IUpdateMilestoneTemplateCommand, UpdateMilestoneTemplateCommand>();
builder.Services.AddScoped<IDeleteMilestoneTemplateCommand, DeleteMilestoneTemplateCommand>();
builder.Services.AddScoped<IGetCatalogTopicsListQuery, GetCatalogTopicsListQuery>();
builder.Services.AddScoped<IGetCatalogTopicDetailQuery, GetCatalogTopicDetailQuery>();
builder.Services.AddScoped<IGetCatalogTopicCreateQuery, GetCatalogTopicCreateQuery>();
builder.Services.AddScoped<IGetCatalogTopicUpdateQuery, GetCatalogTopicUpdateQuery>();
builder.Services.AddScoped<ICreateCatalogTopicCommand, CreateCatalogTopicCommand>();
builder.Services.AddScoped<IUpdateCatalogTopicCommand, UpdateCatalogTopicCommand>();
builder.Services.AddScoped<IDeleteCatalogTopicCommand, DeleteCatalogTopicCommand>();
builder.Services.AddScoped<IGetCatalogTopicTagsListQuery, GetCatalogTopicTagsListQuery>();
builder.Services.AddScoped<IGetCatalogTopicTagCreateQuery, GetCatalogTopicTagCreateQuery>();
builder.Services.AddScoped<IGetCatalogTopicTagDetailQuery, GetCatalogTopicTagDetailQuery>();
builder.Services.AddScoped<IGetCatalogTopicTagsByCatalogTopicQuery, GetCatalogTopicTagsByCatalogTopicQuery>();
builder.Services.AddScoped<IGetCatalogTopicTagsByTagQuery, GetCatalogTopicTagsByTagQuery>();
builder.Services.AddScoped<ICreateCatalogTopicTagCommand, CreateCatalogTopicTagCommand>();
builder.Services.AddScoped<IUpdateCatalogTopicTagCommand, UpdateCatalogTopicTagCommand>();
builder.Services.AddScoped<IDeleteCatalogTopicTagCommand, DeleteCatalogTopicTagCommand>();
builder.Services.AddScoped<IGetLecturerProfilesListQuery, GetLecturerProfilesListQuery>();
builder.Services.AddScoped<IGetLecturerProfileDetailQuery, GetLecturerProfileDetailQuery>();
builder.Services.AddScoped<IGetLecturerProfileCreateQuery, GetLecturerProfileCreateQuery>();
builder.Services.AddScoped<IGetLecturerProfileUpdateQuery, GetLecturerProfileUpdateQuery>();
builder.Services.AddScoped<IGetLecturerAvatarQuery, GetLecturerAvatarQuery>();
builder.Services.AddScoped<ICreateLecturerProfileCommand, CreateLecturerProfileCommand>();
builder.Services.AddScoped<IUpdateLecturerProfileCommand, UpdateLecturerProfileCommand>();
builder.Services.AddScoped<IUploadLecturerAvatarCommand, UploadLecturerAvatarCommand>();
builder.Services.AddScoped<IDeleteLecturerProfileCommand, DeleteLecturerProfileCommand>();
builder.Services.AddScoped<IGetLecturerTagsListQuery, GetLecturerTagsListQuery>();
builder.Services.AddScoped<IGetLecturerTagDetailQuery, GetLecturerTagDetailQuery>();
builder.Services.AddScoped<IGetLecturerTagCreateQuery, GetLecturerTagCreateQuery>();
builder.Services.AddScoped<IGetLecturerTagUpdateQuery, GetLecturerTagUpdateQuery>();
builder.Services.AddScoped<IGetLecturerTagsByLecturerQuery, GetLecturerTagsByLecturerQuery>();
builder.Services.AddScoped<IGetLecturerTagsByTagQuery, GetLecturerTagsByTagQuery>();
builder.Services.AddScoped<ICreateLecturerTagCommand, CreateLecturerTagCommand>();
builder.Services.AddScoped<IUpdateLecturerTagCommand, UpdateLecturerTagCommand>();
builder.Services.AddScoped<IDeleteLecturerTagCommand, DeleteLecturerTagCommand>();
builder.Services.AddScoped<IGetTopicLecturersListQuery, GetTopicLecturersListQuery>();
builder.Services.AddScoped<IGetTopicLecturerDetailQuery, GetTopicLecturerDetailQuery>();
builder.Services.AddScoped<IGetTopicLecturerCreateQuery, GetTopicLecturerCreateQuery>();
builder.Services.AddScoped<IGetTopicLecturerUpdateQuery, GetTopicLecturerUpdateQuery>();
builder.Services.AddScoped<IGetTopicLecturersByTopicQuery, GetTopicLecturersByTopicQuery>();
builder.Services.AddScoped<IGetTopicLecturersByLecturerQuery, GetTopicLecturersByLecturerQuery>();
builder.Services.AddScoped<ICreateTopicLecturerCommand, CreateTopicLecturerCommand>();
builder.Services.AddScoped<IUpdateTopicLecturerCommand, UpdateTopicLecturerCommand>();
builder.Services.AddScoped<IDeleteTopicLecturerCommand, DeleteTopicLecturerCommand>();
builder.Services.AddScoped<IGetProgressMilestonesListQuery, GetProgressMilestonesListQuery>();
builder.Services.AddScoped<IGetProgressMilestoneDetailQuery, GetProgressMilestoneDetailQuery>();
builder.Services.AddScoped<IGetProgressMilestoneCreateQuery, GetProgressMilestoneCreateQuery>();
builder.Services.AddScoped<IGetProgressMilestoneUpdateQuery, GetProgressMilestoneUpdateQuery>();
builder.Services.AddScoped<ICreateProgressMilestoneCommand, CreateProgressMilestoneCommand>();
builder.Services.AddScoped<IUpdateProgressMilestoneCommand, UpdateProgressMilestoneCommand>();
builder.Services.AddScoped<IDeleteProgressMilestoneCommand, DeleteProgressMilestoneCommand>();
builder.Services.AddScoped<IGetProgressSubmissionsListQuery, GetProgressSubmissionsListQuery>();
builder.Services.AddScoped<IGetProgressSubmissionDetailQuery, GetProgressSubmissionDetailQuery>();
builder.Services.AddScoped<IGetProgressSubmissionCreateQuery, GetProgressSubmissionCreateQuery>();
builder.Services.AddScoped<IGetProgressSubmissionUpdateQuery, GetProgressSubmissionUpdateQuery>();
builder.Services.AddScoped<ICreateProgressSubmissionCommand, CreateProgressSubmissionCommand>();
builder.Services.AddScoped<IUpdateProgressSubmissionCommand, UpdateProgressSubmissionCommand>();
builder.Services.AddScoped<IDeleteProgressSubmissionCommand, DeleteProgressSubmissionCommand>();
builder.Services.AddScoped<IGetSubmissionFilesListQuery, GetSubmissionFilesListQuery>();
builder.Services.AddScoped<IGetSubmissionFileDetailQuery, GetSubmissionFileDetailQuery>();
builder.Services.AddScoped<IGetSubmissionFileCreateQuery, GetSubmissionFileCreateQuery>();
builder.Services.AddScoped<IGetSubmissionFileUpdateQuery, GetSubmissionFileUpdateQuery>();
builder.Services.AddScoped<ICreateSubmissionFileCommand, CreateSubmissionFileCommand>();
builder.Services.AddScoped<IUploadSubmissionFileCommand, UploadSubmissionFileCommand>();
builder.Services.AddScoped<IUpdateSubmissionFileCommand, UpdateSubmissionFileCommand>();
builder.Services.AddScoped<IDeleteSubmissionFileCommand, DeleteSubmissionFileCommand>();
builder.Services.AddScoped<IDownloadSubmissionFileCommand, DownloadSubmissionFileCommand>();
builder.Services.AddScoped<IGetStudentProfilesListQuery, GetStudentProfilesListQuery>();
builder.Services.AddScoped<IGetStudentProfileDetailQuery, GetStudentProfileDetailQuery>();
builder.Services.AddScoped<IGetStudentProfileCreateQuery, GetStudentProfileCreateQuery>();
builder.Services.AddScoped<IGetStudentProfileUpdateQuery, GetStudentProfileUpdateQuery>();
builder.Services.AddScoped<IGetStudentAvatarQuery, GetStudentAvatarQuery>();
builder.Services.AddScoped<ICreateStudentProfileCommand, CreateStudentProfileCommand>();
builder.Services.AddScoped<IUpdateStudentProfileCommand, UpdateStudentProfileCommand>();
builder.Services.AddScoped<IUploadStudentAvatarCommand, UploadStudentAvatarCommand>();
builder.Services.AddScoped<IDeleteStudentProfileCommand, DeleteStudentProfileCommand>();
builder.Services.AddScoped<IGetSystemActivityLogsListQuery, GetSystemActivityLogsListQuery>();
builder.Services.AddScoped<IGetSystemActivityLogDetailQuery, GetSystemActivityLogDetailQuery>();
builder.Services.AddScoped<IGetSystemActivityLogsByEntityQuery, GetSystemActivityLogsByEntityQuery>();
builder.Services.AddScoped<IGetSystemActivityLogsByUserQuery, GetSystemActivityLogsByUserQuery>();
builder.Services.AddScoped<IGetSystemActivityLogsByModuleQuery, GetSystemActivityLogsByModuleQuery>();
builder.Services.AddScoped<IGetSystemActivityLogStatsQuery, GetSystemActivityLogStatsQuery>();
builder.Services.AddScoped<IGetConversationsListQuery, GetConversationsListQuery>();
builder.Services.AddScoped<IGetConversationDetailQuery, GetConversationDetailQuery>();
builder.Services.AddScoped<IGetConversationCreateQuery, GetConversationCreateQuery>();
builder.Services.AddScoped<IGetConversationUpdateQuery, GetConversationUpdateQuery>();
builder.Services.AddScoped<ICreateConversationCommand, CreateConversationCommand>();
builder.Services.AddScoped<IUpdateConversationCommand, UpdateConversationCommand>();
builder.Services.AddScoped<IDeleteConversationCommand, DeleteConversationCommand>();
builder.Services.AddScoped<IGetConversationMembersListQuery, GetConversationMembersListQuery>();
builder.Services.AddScoped<IGetConversationMemberDetailQuery, GetConversationMemberDetailQuery>();
builder.Services.AddScoped<IGetConversationMemberCreateQuery, GetConversationMemberCreateQuery>();
builder.Services.AddScoped<IGetConversationMemberUpdateQuery, GetConversationMemberUpdateQuery>();
builder.Services.AddScoped<ICreateConversationMemberCommand, CreateConversationMemberCommand>();
builder.Services.AddScoped<IUpdateConversationMemberCommand, UpdateConversationMemberCommand>();
builder.Services.AddScoped<IDeleteConversationMemberCommand, DeleteConversationMemberCommand>();
builder.Services.AddScoped<IGetMessagesListQuery, GetMessagesListQuery>();
builder.Services.AddScoped<IGetMessageDetailQuery, GetMessageDetailQuery>();
builder.Services.AddScoped<IGetMessageCreateQuery, GetMessageCreateQuery>();
builder.Services.AddScoped<IGetMessageUpdateQuery, GetMessageUpdateQuery>();
builder.Services.AddScoped<ICreateMessageCommand, CreateMessageCommand>();
builder.Services.AddScoped<IUpdateMessageCommand, UpdateMessageCommand>();
builder.Services.AddScoped<IDeleteMessageCommand, DeleteMessageCommand>();
builder.Services.AddScoped<IGetMessageAttachmentsListQuery, GetMessageAttachmentsListQuery>();
builder.Services.AddScoped<IGetMessageAttachmentDetailQuery, GetMessageAttachmentDetailQuery>();
builder.Services.AddScoped<IGetMessageAttachmentCreateQuery, GetMessageAttachmentCreateQuery>();
builder.Services.AddScoped<IGetMessageAttachmentUpdateQuery, GetMessageAttachmentUpdateQuery>();
builder.Services.AddScoped<ICreateMessageAttachmentCommand, CreateMessageAttachmentCommand>();
builder.Services.AddScoped<IUploadMessageAttachmentCommand, UploadMessageAttachmentCommand>();
builder.Services.AddScoped<IUpdateMessageAttachmentCommand, UpdateMessageAttachmentCommand>();
builder.Services.AddScoped<IDeleteMessageAttachmentCommand, DeleteMessageAttachmentCommand>();
builder.Services.AddScoped<IGetMessageReactionsListQuery, GetMessageReactionsListQuery>();
builder.Services.AddScoped<IGetMessageReactionDetailQuery, GetMessageReactionDetailQuery>();
builder.Services.AddScoped<IGetMessageReactionCreateQuery, GetMessageReactionCreateQuery>();
builder.Services.AddScoped<IGetMessageReactionUpdateQuery, GetMessageReactionUpdateQuery>();
builder.Services.AddScoped<ICreateMessageReactionCommand, CreateMessageReactionCommand>();
builder.Services.AddScoped<IUpdateMessageReactionCommand, UpdateMessageReactionCommand>();
builder.Services.AddScoped<IDeleteMessageReactionCommand, DeleteMessageReactionCommand>();
builder.Services.AddScoped<IGetMessageReadReceiptsListQuery, GetMessageReadReceiptsListQuery>();
builder.Services.AddScoped<IGetMessageReadReceiptDetailQuery, GetMessageReadReceiptDetailQuery>();
builder.Services.AddScoped<IGetMessageReadReceiptCreateQuery, GetMessageReadReceiptCreateQuery>();
builder.Services.AddScoped<IGetMessageReadReceiptUpdateQuery, GetMessageReadReceiptUpdateQuery>();
builder.Services.AddScoped<ICreateMessageReadReceiptCommand, CreateMessageReadReceiptCommand>();
builder.Services.AddScoped<IUpdateMessageReadReceiptCommand, UpdateMessageReadReceiptCommand>();
builder.Services.AddScoped<IDeleteMessageReadReceiptCommand, DeleteMessageReadReceiptCommand>();
builder.Services.AddScoped<IGetTopicTagsListQuery, GetTopicTagsListQuery>();
builder.Services.AddScoped<IGetTopicTagCreateQuery, GetTopicTagCreateQuery>();
builder.Services.AddScoped<IGetTopicTagsByTopicQuery, GetTopicTagsByTopicQuery>();
builder.Services.AddScoped<IGetTopicTagsByCatalogTopicQuery, GetTopicTagsByCatalogTopicQuery>();
builder.Services.AddScoped<IGetTopicTagUpdateByTopicCodeQuery, GetTopicTagUpdateByTopicCodeQuery>();
builder.Services.AddScoped<ICreateTopicTagCommand, CreateTopicTagCommand>();
builder.Services.AddScoped<ICreateTopicTagByTopicCodeCommand, CreateTopicTagByTopicCodeCommand>();
builder.Services.AddScoped<IUpdateTopicTagByTopicCodeCommand, UpdateTopicTagByTopicCodeCommand>();
builder.Services.AddScoped<IDeleteTopicTagByTopicCodeCommand, DeleteTopicTagByTopicCodeCommand>();
builder.Services.AddScoped<ITopicCodeGenerator, TopicCodeGenerator>();
builder.Services.AddScoped<IGetTopicsListQuery, GetTopicsListQuery>();
builder.Services.AddScoped<IGetTopicDetailQuery, GetTopicDetailQuery>();
builder.Services.AddScoped<IGetTopicCreateQuery, GetTopicCreateQuery>();
builder.Services.AddScoped<IGetTopicUpdateQuery, GetTopicUpdateQuery>();
builder.Services.AddScoped<ICreateTopicCommand, CreateTopicCommand>();
builder.Services.AddScoped<IUpdateTopicCommand, UpdateTopicCommand>();
builder.Services.AddScoped<IDeleteTopicCommand, DeleteTopicCommand>();
builder.Services.AddScoped<IGetCommitteesQuery, GetCommitteesQuery>();
builder.Services.AddScoped<IGetCommitteeDetailQuery, GetCommitteeDetailQuery>();
builder.Services.AddScoped<IGetCommitteeCreateInitQuery, GetCommitteeCreateInitQuery>();
builder.Services.AddScoped<IGetAvailableLecturersQuery, GetAvailableLecturersQuery>();
builder.Services.AddScoped<IGetAvailableTopicsQuery, GetAvailableTopicsQuery>();
builder.Services.AddScoped<IGetCommitteeTagsQuery, GetCommitteeTagsQuery>();
builder.Services.AddScoped<IGetLecturerCommitteesQuery, GetLecturerCommitteesQuery>();
builder.Services.AddScoped<IGetStudentDefenseInfoQuery, GetStudentDefenseInfoQuery>();
builder.Services.AddScoped<ICreateCommitteeCommand, CreateCommitteeCommand>();
builder.Services.AddScoped<IUpdateCommitteeCommand, UpdateCommitteeCommand>();
builder.Services.AddScoped<IUpdateCommitteeMembersCommand, UpdateCommitteeMembersCommand>();
builder.Services.AddScoped<ISaveCommitteeMembersCommand, SaveCommitteeMembersCommand>();
builder.Services.AddScoped<IDeleteCommitteeCommand, DeleteCommitteeCommand>();
builder.Services.AddScoped<IAssignTopicsCommand, AssignTopicsCommand>();
builder.Services.AddScoped<IAutoAssignTopicsCommand, AutoAssignTopicsCommand>();
builder.Services.AddScoped<IChangeAssignmentCommand, ChangeAssignmentCommand>();
builder.Services.AddScoped<IRemoveAssignmentCommand, RemoveAssignmentCommand>();

// Filters
builder.Services.AddScoped<ThesisManagement.Api.Filters.ActivityLogFilter>();

var app = builder.Build();

// Development: Swagger
if (app.Environment.IsDevelopment())
{
    // Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.DocumentTitle = "ThesisManagement API - Swagger";
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
    });
}

app.UseHttpsRedirection();

// Ensure routing is set up so CORS can be applied to endpoints
app.UseRouting();

// Apply CORS early so it covers controller endpoints and static file responses
app.UseCors("AllowAll");

app.UseAuthentication();

// Legacy X-User-* header middleware removed after FE migrated to JWT Bearer.

// Serve static files from wwwroot (so /uploads/{file} is accessible)
// Add OnPrepareResponse to ensure static file responses include CORS headers
app.UseStaticFiles(new Microsoft.AspNetCore.Builder.StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var headers = ctx.Context.Response.Headers;
        var origin = ctx.Context.Request.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin))
        {
            // Mirror the Origin to allow credentials
            headers.Append("Access-Control-Allow-Origin", origin);
            headers.Append("Access-Control-Allow-Credentials", "true");
        }
        else
        {
            // Fallback to wildcard for non-browser clients
            headers.Append("Access-Control-Allow-Origin", "*");
        }
        if (!headers.ContainsKey("Access-Control-Expose-Headers"))
            headers.Append("Access-Control-Expose-Headers", "Content-Disposition,Content-Length,Content-Type");
    }
});

app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
