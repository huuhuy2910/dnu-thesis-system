using ThesisManagement.Api.Models;

namespace ThesisManagement.Api.Services.Chat
{
    public class ChatProvisionService : IChatProvisionService
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;

        public ChatProvisionService(IUnitOfWork uow, ICodeGenerator codeGenerator)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
        }

        public async Task EnsureForAcceptedTopicAsync(Topic topic)
        {
            if (string.IsNullOrWhiteSpace(topic.TopicCode)
                || string.IsNullOrWhiteSpace(topic.ProposerUserCode)
                || string.IsNullOrWhiteSpace(topic.SupervisorUserCode))
            {
                return;
            }

            var proposerUserCode = topic.ProposerUserCode;
            var supervisorUserCode = topic.SupervisorUserCode;
            var proposerUserId = await GetUserIdByCodeAsync(proposerUserCode);
            var supervisorUserId = await GetUserIdByCodeAsync(supervisorUserCode);

            if (!proposerUserId.HasValue || !supervisorUserId.HasValue)
            {
                return;
            }

            var directConversationCode = BuildConversationCode("DIR", topic.TopicCode);

            var directConversation = _uow.Conversations.Query().FirstOrDefault(x =>
                x.ConversationCode == directConversationCode);

            if (directConversation == null)
            {
                directConversation = new Conversation
                {
                    ConversationCode = directConversationCode,
                    ConversationType = "Direct",
                    Title = $"{topic.Title}",
                    CreatedByUserID = supervisorUserId.Value,
                    CreatedByUserCode = supervisorUserCode,
                    IsArchived = false,
                    CreatedAt = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow
                };

                await _uow.Conversations.AddAsync(directConversation);
                await _uow.SaveChangesAsync();
            }

            await EnsureMemberAsync(directConversation.ConversationID, directConversation.ConversationCode, proposerUserId.Value, proposerUserCode, "Member");
            await EnsureMemberAsync(directConversation.ConversationID, directConversation.ConversationCode, supervisorUserId.Value, supervisorUserCode, "Owner");

            var managedGroupCode = BuildConversationCode("LGR", supervisorUserCode);

            var managedGroup = _uow.Conversations.Query().FirstOrDefault(x =>
                x.ConversationCode == managedGroupCode);

            if (managedGroup == null)
            {
                managedGroup = new Conversation
                {
                    ConversationCode = managedGroupCode,
                    ConversationType = "Group",
                    Title = $"Managed by {supervisorUserCode}",
                    CreatedByUserID = supervisorUserId.Value,
                    CreatedByUserCode = supervisorUserCode,
                    IsArchived = false,
                    CreatedAt = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow
                };

                await _uow.Conversations.AddAsync(managedGroup);
                await _uow.SaveChangesAsync();
            }

            await EnsureMemberAsync(managedGroup.ConversationID, managedGroup.ConversationCode, supervisorUserId.Value, supervisorUserCode, "Owner");
            await EnsureMemberAsync(managedGroup.ConversationID, managedGroup.ConversationCode, proposerUserId.Value, proposerUserCode, "Member");
        }

        private async Task EnsureMemberAsync(int conversationId, string conversationCode, int userId, string userCode, string role)
        {
            var existed = _uow.ConversationMembers.Query().FirstOrDefault(x =>
                x.ConversationID == conversationId && x.UserCode == userCode);

            if (existed != null)
            {
                var changed = false;
                if (existed.LeftAt.HasValue)
                {
                    existed.LeftAt = null;
                    changed = true;
                }

                if (!string.Equals(existed.MemberRole, role, StringComparison.OrdinalIgnoreCase))
                {
                    existed.MemberRole = role;
                    changed = true;
                }

                if (changed)
                {
                    _uow.ConversationMembers.Update(existed);
                    await _uow.SaveChangesAsync();
                }

                return;
            }

            await _uow.ConversationMembers.AddAsync(new ConversationMember
            {
                ConversationID = conversationId,
                ConversationCode = conversationCode,
                UserID = userId,
                UserCode = userCode,
                MemberRole = role,
                IsMuted = false,
                IsPinned = false,
                UnreadCount = 0,
                JoinedAt = DateTime.UtcNow
            });

            await _uow.SaveChangesAsync();
        }

        private async Task<int?> GetUserIdByCodeAsync(string userCode)
        {
            var user = await _uow.Users.GetByCodeAsync(userCode);
            return user?.UserID;
        }

        private static string BuildConversationCode(string prefix, string seed)
        {
            var normalized = seed.Trim().ToUpperInvariant().Replace(" ", "_");
            var raw = $"{prefix}-{normalized}";
            return raw.Length <= 50 ? raw : raw[..50];
        }
    }
}
