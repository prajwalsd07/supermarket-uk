import { PencilLine, Plus, Search, Store } from 'lucide-react'
import { toast } from 'sonner'
import { allUsersList, stores } from '../data/seed'
import { PageHeader } from '../components/common/PageHeader'
import { StatusBadge } from '../components/common/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & stores"
        description="Manage access across the supermarket network."
        actions={
          <Button onClick={() => toast.message('Prototype: new-user form opened')}>
            <Plus size={16} /> Add user
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stores.map(s => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Store size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500">{s.code} · 5 active users</p>
              </div>
              <StatusBadge type="approved">Active</StatusBadge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All users</CardTitle>
              <CardDescription>21 active accounts across four stores.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" placeholder="Search users" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Supermarket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsersList.map(u => (
                <TableRow key={u[1]}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {u[0]
                          .split(' ')
                          .map(x => x[0])
                          .join('')}
                      </span>
                      <strong>{u[0]}</strong>
                    </div>
                  </TableCell>
                  <TableCell>{u[1]}</TableCell>
                  <TableCell>{u[2]}</TableCell>
                  <TableCell>{u[3]}</TableCell>
                  <TableCell>
                    <StatusBadge type="approved">{u[4]}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.message(`Prototype: edit ${u[0]}`)}
                    >
                      <PencilLine size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
