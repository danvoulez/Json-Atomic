/**
 * Example atomic transactions for the playground
 */

export const examples = {
  simple: {
    name: 'Simple Document',
    description: 'A basic atomic with minimal fields',
    atomic: {
      entity_type: 'document',
      this: {
        title: 'My First Atomic',
        content: 'Hello, JsonAtomic!',
      },
      did: 'did:example:alice',
      trace_id: '550e8400-e29b-41d4-a716-446655440000',
    },
  },
  
  user: {
    name: 'User Profile',
    description: 'A user profile atomic',
    atomic: {
      entity_type: 'user',
      this: {
        username: 'alice',
        email: 'alice@example.com',
        displayName: 'Alice Wonderland',
      },
      did: 'did:example:alice',
      metadata: {
        created: '2024-01-01T00:00:00Z',
        version: 1,
      },
      trace_id: '550e8400-e29b-41d4-a716-446655440001',
    },
  },
  
  transaction: {
    name: 'Financial Transaction',
    description: 'A financial transaction atomic',
    atomic: {
      entity_type: 'transaction',
      this: {
        from: 'did:example:alice',
        to: 'did:example:bob',
        amount: 100,
        currency: 'USD',
        description: 'Payment for services',
      },
      did: 'did:example:alice',
      metadata: {
        timestamp: '2024-01-15T10:30:00Z',
        type: 'payment',
        status: 'pending',
      },
      trace_id: '550e8400-e29b-41d4-a716-446655440002',
    },
  },
  
  contract: {
    name: 'Smart Contract',
    description: 'A smart contract atomic',
    atomic: {
      entity_type: 'contract',
      this: {
        name: 'Service Agreement',
        parties: ['did:example:alice', 'did:example:bob'],
        terms: {
          duration: '1 year',
          payment: 1000,
          deliverables: ['Website', 'Mobile App'],
        },
        code: 'function execute() { return true; }',
      },
      did: 'did:example:alice',
      metadata: {
        status: 'active',
        created: '2024-01-01T00:00:00Z',
        expires: '2025-01-01T00:00:00Z',
      },
      trace_id: '550e8400-e29b-41d4-a716-446655440003',
    },
  },
  
  governance: {
    name: 'Governance Proposal',
    description: 'A governance proposal atomic',
    atomic: {
      entity_type: 'proposal',
      this: {
        title: 'Update Protocol Parameters',
        description: 'Proposal to increase block size',
        proposer: 'did:example:alice',
        options: ['yes', 'no', 'abstain'],
        votingPeriod: {
          start: '2024-02-01T00:00:00Z',
          end: '2024-02-15T00:00:00Z',
        },
      },
      did: 'did:example:alice',
      metadata: {
        category: 'protocol',
        importance: 'high',
        requiredQuorum: 0.67,
      },
      trace_id: '550e8400-e29b-41d4-a716-446655440004',
    },
  },
  
  linked: {
    name: 'Linked Atomic',
    description: 'An atomic that references a previous one',
    atomic: {
      entity_type: 'comment',
      this: {
        text: 'This is a comment on the previous atomic',
        author: 'did:example:bob',
      },
      did: 'did:example:bob',
      previous_hash: 'abc123def456...',
      metadata: {
        replyTo: '550e8400-e29b-41d4-a716-446655440000',
      },
      trace_id: '550e8400-e29b-41d4-a716-446655440005',
    },
  },
};

export type ExampleKey = keyof typeof examples;
