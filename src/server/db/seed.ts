import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { boards, columns, tasks } from './schema';
import { ulid } from 'ulid';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(connectionString);
const db = drizzle(sql);

const BOARD_1_ID = '01JCZXYZ3NDEKTSV4RRFFQ69G';
const BOARD_2_ID = '01JCZXYZ4ABCTSV4RRFFQ69G5';
const USER_1_ID = '01JCZXYZ5CDEKTSV4RRFFQ69G6';

async function seed() {
  console.log('🌱 Seeding database...');

  await db.delete(tasks);
  await db.delete(columns);
  await db.delete(boards);

  await db.insert(boards).values([
    {
      id: BOARD_1_ID,
      name: 'Project Alpha',
      description: 'Main development board',
      userId: USER_1_ID,
    },
    {
      id: BOARD_2_ID,
      name: 'Marketing Campaign',
      description: 'Q1 marketing tasks',
      userId: USER_1_ID,
    },
  ]);

  console.log('✅ Boards seeded');

  const defaults = [
    { name: 'To Do', color: 'bg-destructive' },
    { name: 'Doing', color: 'bg-chart-3' },
    { name: 'Done', color: 'bg-chart-4' },
  ];

  const columnRows = defaults.map((c, i) => ({
    id: ulid(),
    userId: USER_1_ID,
    name: c.name,
    color: c.color,
    position: i,
  }));

  await db.insert(columns).values(columnRows);
  const todoId = columnRows[0]!.id;
  const doingId = columnRows[1]!.id;
  const doneId = columnRows[2]!.id;

  console.log('✅ Columns seeded');

  await db.insert(tasks).values([
    {
      id: ulid(),
      title: 'Setup project structure',
      description: 'Initialize the project with Next.js and configure TypeScript',
      priority: 'high',
      columnId: doneId,
      boardId: BOARD_1_ID,
      pr: 1,
      userId: USER_1_ID,
    },
    {
      id: ulid(),
      title: 'Design database schema',
      description: 'Create ERD and define all tables for the application',
      priority: 'high',
      columnId: doingId,
      boardId: BOARD_1_ID,
      pr: 2,
      userId: USER_1_ID,
    },
    {
      id: ulid(),
      title: 'Implement authentication',
      description: 'Add OAuth login with Google and GitHub providers',
      priority: 'medium',
      columnId: todoId,
      boardId: BOARD_1_ID,
      pr: 3,
      userId: USER_1_ID,
    },
    {
      id: ulid(),
      title: 'Write unit tests',
      description: 'Add Jest tests for all utility functions',
      priority: 'low',
      columnId: todoId,
      boardId: BOARD_1_ID,
      pr: 4,
      userId: USER_1_ID,
    },
    {
      id: ulid(),
      title: 'Create landing page',
      description: 'Design and implement the marketing landing page',
      priority: 'high',
      columnId: doingId,
      boardId: BOARD_2_ID,
      pr: 1,
      userId: USER_1_ID,
    },
  ]);

  console.log('✅ Tasks seeded');
  console.log('🎉 Seeding complete!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
