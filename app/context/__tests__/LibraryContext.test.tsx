import { render, act, waitFor } from '@testing-library/react';
import { LibraryProvider, useLibrary } from '../LibraryContext';
import { useEffect } from 'react';

// Mock fetch for initial data
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        title: "Test Article 1",
        authors: "Author 1",
        citations: 100,
        year: "2020",
        journal: "Test Journal",
        abstract: "Test Abstract 1"
      }
    ])
  })
);

const TestComponent = ({ onContextReady }: { onContextReady: (context: any) => void }) => {
  const context = useLibrary();
  useEffect(() => {
    onContextReady(context);
  }, [context, onContextReady]);
  return null;
};

describe('LibraryContext CRUD Operations', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should add a new entry successfully', async () => {
    let contextData: any;
    
    const newEntry = {
      title: "New Article",
      authors: "New Author",
      citations: 50,
      year: "2023",
      journal: "New Journal",
      abstract: "New Abstract",
      domain: "Test Domain"
    };

    render(
      <LibraryProvider>
        <TestComponent onContextReady={(context) => {
          contextData = context;
        }} />
      </LibraryProvider>
    );

    await waitFor(() => {
      expect(contextData.entries.length).toBe(1);
    });

    await act(async () => {
      await contextData.addEntry(newEntry);
    });

    expect(contextData.entries.length).toBe(2);
    expect(contextData.entries[1]).toEqual(newEntry);
  });

  it('should add entry with correct data types', async () => {
    let contextData: any;
    
    const newEntry = {
      title: "Type Test Article",
      authors: "Test Author",
      citations: 75,
      year: "2022",
      journal: "Test Journal",
      abstract: "Test Abstract",
      domain: "Test Domain"
    };

    render(
      <LibraryProvider>
        <TestComponent onContextReady={(context) => {
          contextData = context;
        }} />
      </LibraryProvider>
    );

    await waitFor(() => {
      expect(contextData.entries.length).toBe(1);
    });

    await act(async () => {
      await contextData.addEntry(newEntry);
    });

    await waitFor(() => {
      expect(contextData.entries.length).toBe(2);
      expect(typeof contextData.entries[1].citations).toBe('number');
      expect(typeof contextData.entries[1].year).toBe('string');
    });
  });

  it('should load initial data correctly', async () => {
    let contextData: any;

    render(
      <LibraryProvider>
        <TestComponent onContextReady={(context) => {
          contextData = context;
        }} />
      </LibraryProvider>
    );

    await waitFor(() => {
      expect(contextData.entries.length).toBe(1);
      expect(contextData.entries[0].title).toBe("Test Article 1");
    });
  });

  it('should update an existing entry', async () => {
    let contextData: any;
    
    const updatedEntry = {
      title: "Updated Article",
      authors: "Updated Author",
      citations: 150,
      year: "2021",
      journal: "Updated Journal",
      abstract: "Updated Abstract",
      domain: "Updated Domain"
    };

    render(
      <LibraryProvider>
        <TestComponent onContextReady={(context) => {
          contextData = context;
        }} />
      </LibraryProvider>
    );

    await waitFor(() => {
      expect(contextData.entries.length).toBe(1);
    });

    await act(async () => {
      await contextData.updateEntry(0, updatedEntry);
    });

    expect(contextData.entries[0]).toEqual(updatedEntry);
  });

  it('should maintain data structure after update', async () => {
    let contextData: any;
    
    const updatedEntry = {
      title: "Structure Test",
      authors: "Test Author",
      citations: 200,
      year: "2024",
      journal: "Test Journal",
      abstract: "Test Abstract",
      domain: "Test Domain"
    };

    render(
      <LibraryProvider>
        <TestComponent onContextReady={(context) => {
          contextData = context;
        }} />
      </LibraryProvider>
    );

    await act(async () => {
      await contextData.updateEntry(0, updatedEntry);
    });

    expect(contextData.entries[0]).toHaveProperty('title');
    expect(contextData.entries[0]).toHaveProperty('citations');
    expect(typeof contextData.entries[0].citations).toBe('number');
  });

  // DELETE Tests
  it('should delete an entry successfully', async () => {
    let contextData: any;

    render(
      <LibraryProvider>
        <TestComponent onContextReady={(context) => {
          contextData = context;
        }} />
      </LibraryProvider>
    );

    await waitFor(() => {
      expect(contextData.entries.length).toBe(1);
    });

    await act(async () => {
      await contextData.deleteEntry(0);
    });

    expect(contextData.entries.length).toBe(0);
  });

  it('should update entries length after deletion', async () => {
    let contextData: any;

    render(
      <LibraryProvider>
        <TestComponent onContextReady={(context) => {
          contextData = context;
        }} />
      </LibraryProvider>
    );

    await waitFor(() => {
      expect(contextData.entries.length).toBe(1);
    });

    await act(async () => {
      await contextData.deleteEntry(0);
    });

    expect(contextData.entries.length).toBe(0);
  });
}); 