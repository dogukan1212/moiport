"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Mock data (Since we don't have a direct 'all users' endpoint yet)
// In a real app, you would fetch this from /api/users?scope=all
const MOCK_USERS = [
  { id: "1", name: "Doğukan Murat adak", email: "admin@ajans.local", role: "ADMIN", tenant: "Ajans 1 Medya", status: "Aktif", lastLogin: "2 saat önce" },
  { id: "2", name: "Test Personel", email: "staff@ajans.local", role: "STAFF", tenant: "Ajans 1 Medya", status: "Aktif", lastLogin: "1 gün önce" },
  { id: "3", name: "SaaS Super Admin", email: "super@saas.com", role: "SUPER_ADMIN", tenant: "Sistem", status: "Aktif", lastLogin: "Şimdi" },
];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Kullanıcılar</h1>
        <p className="text-slate-500 mt-2">Sistemdeki tüm kullanıcıları buradan yönetebilirsiniz.</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="İsim, e-posta veya ajans ara..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Filter className="w-4 h-4" />
          Filtrele
        </button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Kullanıcı</th>
                  <th className="px-6 py-4 font-medium">Ajans</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium">Durum</th>
                  <th className="px-6 py-4 font-medium">Son Giriş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-slate-500 text-xs">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.tenant}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'SUPER_ADMIN' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20' :
                        user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{user.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
