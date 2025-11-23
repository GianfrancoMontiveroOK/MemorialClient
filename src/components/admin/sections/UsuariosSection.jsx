// src/components/admin/sections/UsuariosSection.jsx
import React from "react";
import UsuariosPanel from "../../UsuariosPanel";

export default function UsuariosSection({
  users,
  loading,
  page,
  total,
  limit,
  onPageChange,
  onSearch,
  onSelectUser,
  onChangeRole,
  onAssignCobrador,
  onAssignVendedor,
  onChangeCommission, // 👈 NUEVO
  onChangeCommissionGraceDays, // 👈 NUEVO
  onChangeCommissionPenaltyPerDay, // 👈 NUEVO
}) {
  return (
    <UsuariosPanel
      users={users}
      loading={loading}
      page={page}
      total={total}
      limit={limit}
      onPageChange={onPageChange}
      onSearch={onSearch}
      onSelectUser={onSelectUser}
      onChangeRole={onChangeRole}
      onAssignCobrador={onAssignCobrador}
      onAssignVendedor={onAssignVendedor}
      onChangeCommission={onChangeCommission}
      onChangeCommissionGraceDays={onChangeCommissionGraceDays}
      onChangeCommissionPenaltyPerDay={onChangeCommissionPenaltyPerDay}
    />
  );
}
