export interface DemoAccount {
  role: 'Admin' | 'Dispatcher' | 'Technician';
  email: string;
  password: string;
  description: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: 'Admin',
    email: 'admin.demo@a3fsm.com',
    password: 'DemoAdmin2026!',
    description: 'Explore dashboards, technicians, assignments, timelines, and reports.'
  },
  {
    role: 'Dispatcher',
    email: 'dispatcher.demo@a3fsm.com',
    password: 'DemoDispatch2026!',
    description: 'Explore work-order dispatch, assignments, SLA visibility, and activity.'
  },
  {
    role: 'Technician',
    email: 'tech.demo@a3fsm.com',
    password: 'DemoTech2026!',
    description: 'Explore assigned work, field updates, completion reports, and sign-off.'
  }
];
