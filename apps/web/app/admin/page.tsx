import { initialAdminState } from "@time-machine/admin-engine";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata = {
  title: "Admin — Time Machine",
};

export default function AdminPage() {
  return <AdminApp initialState={initialAdminState} />;
}
