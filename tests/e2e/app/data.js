export const users = [
  { id: 1, email: "george.bluth@example.com", first_name: "George", last_name: "Bluth" },
  { id: 2, email: "janet.weaver@example.com", first_name: "Janet", last_name: "Weaver" },
  { id: 3, email: "emma.wong@example.com", first_name: "Emma", last_name: "Wong" },
  { id: 4, email: "eve.holt@example.com", first_name: "Eve", last_name: "Holt" },
  { id: 5, email: "george.edwards@example.com", first_name: "George", last_name: "Edwards" },
];

export const departments = [
  { value: 1, title: "HR", subtitle: "Human resources" },
  { value: 2, title: "IT", subtitle: "Information technology and something more just for text" },
  { value: 3, title: "Finance", subtitle: "Accounting and finance" },
  { value: 4, title: "Sales", subtitle: "Sales and marketing" },
  { value: 5, title: "Operations", subtitle: "Operations and logistics" },
  { value: 6, title: "Legal", subtitle: "Legal and compliance" },
];

const emailItem = (user) => ({
  ...user,
  value: user.email,
  title: user.email,
  subtitle: `${user.first_name} ${user.last_name}`,
});

const row = (user, department, phone, salary) => ({
  email: emailItem(user),
  name: { name: `${user.first_name} ${user.last_name}`, id: user.id },
  department,
  phone,
  salary,
});

export const filledRows = () => [
  row(users[0], departments[1], "555-0101", 1000),
  row(users[1], departments[2], "555-0102", 1200),
  row(users[2], departments[0], "555-0103", 1500),
];

export const manyRows = () => Array.from({ length: 20 }, (_, i) =>
  row(users[i % users.length], departments[i % departments.length], `555-01${String(i).padStart(2, "0")}`, 1000 + i));

// Dynamic loading of items, the same as in the example but without the network
export const searchUsers = (value, delay = 100) => new Promise(resolve => {
  const text = (value ?? "").toLowerCase();
  const found = text.length === 0 ? [] : users.filter(user =>
    user.email.toLowerCase().includes(text) || `${user.first_name} ${user.last_name}`.toLowerCase().includes(text));
  setTimeout(() => resolve(found.map(emailItem)), delay);
});
