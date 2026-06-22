let counter = 0;

function next() {
    return ++counter;
}

export function userFixture(overrides?: Partial<{ email: string; password: string }>) {
    const n = next();
    return {
        email: `testuser${n}@example.com`,
        password: 'Password123!',
        ...overrides
    };
}

export function categoryFixture(overrides?: Partial<{ name: string; color: string; icon: string }>) {
    const n = next();
    return {
        name: `Category ${n}`,
        color: '#AABBCC',
        icon: 'tag',
        ...overrides
    };
}

export function expenseFixture(
    categoryId: string,
    overrides?: Partial<{ amount: number; description: string; date: string }>
) {
    return {
        amount: 42.5,
        description: 'Test expense',
        date: '2025-01-15',
        categoryId,
        ...overrides
    };
}
