              <h2 className="section-title-sm">
                <Gavel size={18} color="#0f172a" /> Trung tâm quản lý hội đồng
              </h2>
              <div style={{ color: "#0f172a", fontSize: 13, marginBottom: 10 }}>
                Quản lý danh sách hội đồng theo phòng, tags và trạng thái.
              </div>

              <div
                style={{
                  position: "sticky",
                  top: 10,
                  zIndex: 6,
                  marginBottom: 12,
                  border: "1px solid #cbd5e1",
                  borderRadius: 12,
                  background: "#ffffff",
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "#0f172a" }}>
                    Danh sách hội đồng: {councilListLocked ? "Đã chốt" : "Đang mở chỉnh sửa"}
                  </div>
                  {!councilListLocked && (
                    <div style={{ fontSize: 12, color: "#b45309" }}>
                      Cần chốt danh sách hội đồng trước khi CT mở phiên chấm.
                    </div>
                  )}
                  {councilListLocked && !isAdminRole && (
                    <div style={{ fontSize: 12, color: "#1d4ed8" }}>
                      Danh sách đã chốt: chỉ tài khoản Admin mới có quyền mở lại.
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {canLockCouncils && (
                    <button
                      type="button"
                      onClick={lockCouncils}
                      disabled={
                        !stateHydrated ||
                        councilListLocked ||
                        Boolean(actionInFlight)
                      }
                      className="committee-primary-btn"
                    >
                      <Lock size={14} /> Chốt danh sách hội đồng
                    </button>
                  )}
                  {showReopenCouncils && (
                    <button
                      type="button"
                      onClick={reopenCouncils}
                      title={
                        !canReopenCouncils
                          ? "Chỉ tài khoản Admin mới được mở lại chốt hội đồng."
                          : undefined
                      }
                      disabled={
                        !stateHydrated ||
                        !councilListLocked ||
                        Boolean(actionInFlight) ||
                        !canReopenCouncils
                      }
                      className="committee-ghost-btn"
                    >
                      <RefreshCw size={14} /> Mở lại chốt hội đồng
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                  >
                    Tìm hội đồng
                  </span>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={14}
                      color="#0f172a"
                      style={{ position: "absolute", left: 10, top: 11 }}
                    />
                    <input
                      value={searchCouncil}
                      onChange={(event) => {
                        setSearchCouncil(event.target.value);
                        setCouncilPage(1);
                      }}
                      placeholder="VD: HD-2026-01, FULLDAY"
                      style={{
                        width: "100%",
                        padding: "8px 10px 8px 32px",
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </div>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                  >
                    Lọc theo tags
                  </span>
                  <InlinePicker
                    value={tagFilter}
                    onChange={(event) => {
                      setTagFilter(event);
                      setCouncilPage(1);
                    }}
                    ariaLabel="Lọc theo tags"
                    className="prepare-picker-wide committee-filter-picker"
                    options={[
                      { value: "all", label: "Tất cả tags" },
                      ...allTags.map((tag) => ({
                        value: tag,
                        label: getTagDisplayName(tag),
                      })),
                    ]}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                  >
                    Lọc theo phòng
                  </span>
                  <InlinePicker
                    value={roomFilter}
                    onChange={(event) => {
                      setRoomFilter(event);
                      setCouncilPage(1);
                    }}
                    ariaLabel="Lọc theo phòng"
                    className="prepare-picker-wide committee-filter-picker"
                    options={[
                      { value: "all", label: "Tất cả phòng" },
                      ...availableRooms.map((room) => ({
                        value: room,
                        label: room,
                      })),
                    ]}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}
                  >
                    Lọc theo ngày
                  </span>
                  <InlinePicker
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event);
                      setCouncilPage(1);
                    }}
                    ariaLabel="Lọc theo ngày"
                    className="prepare-picker-wide committee-filter-picker"
                    options={[
                      { value: "all", label: "Tất cả ngày" },
                      ...availableDates.map((date) => ({
                        value: date,
                        label: new Date(date).toLocaleDateString("vi-VN"),
                      })),
                    ]}
                  />
                </label>
              </div>

              <div
                style={{
                  marginBottom: 10,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: 10,
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  Lịch hội đồng theo ngày
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {councilsPerDate.map((item) => (
                    <span
                      key={item.date}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                        color: "#0f172a",
                        background: "#ffffff",
                      }}
                    >
                      {new Date(item.date).toLocaleDateString("vi-VN")}:{" "}
                      {item.count} hội đồng
                    </span>
                  ))}
                </div>
              </div>

              <div
