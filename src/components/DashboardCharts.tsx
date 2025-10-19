import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Candidate } from '@/hooks/useCandidates';

interface DashboardChartsProps {
  candidates: Candidate[];
}

const COLORS = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  interviewed: '#8b5cf6',
  hired: '#10b981',
  rejected: '#ef4444'
};

const STATUS_LABELS = {
  new: 'Nuovo',
  contacted: 'Contattato',
  interviewed: 'Intervistato',
  hired: 'Assunto',
  rejected: 'Scartato'
};

export const DashboardCharts = ({ candidates }: DashboardChartsProps) => {
  const statusData = Object.entries(
    candidates.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, value]) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
    value,
    color: COLORS[status as keyof typeof COLORS]
  }));

  const monthlyData = candidates.reduce((acc, c) => {
    const month = new Date(c.created_at).toLocaleDateString('it-IT', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, [] as Array<{ month: string; count: number }>).slice(-6);

  const positionData = Object.entries(
    candidates.reduce((acc, c) => {
      if (c.position) {
        acc[c.position] = (acc[c.position] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([position, count]) => ({ position: position.slice(0, 20), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Distribuzione per Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Candidati per Mese</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Candidati" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-0 shadow-soft lg:col-span-2">
        <CardHeader>
          <CardTitle>Top 5 Posizioni</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={positionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Candidati" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
