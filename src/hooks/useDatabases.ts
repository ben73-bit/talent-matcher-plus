// Questo hook non è più necessario in quanto la gestione dei database e della collaborazione è stata rimossa.
export function useDatabases() {
  return {
    ownDatabases: [],
    sharedDatabases: [],
    loading: false,
    createDatabase: async () => null,
    updateDatabase: async () => null,
    deleteDatabase: async () => false,
    inviteCollaborator: async () => null,
    getCollaborators: async () => [],
    removeCollaborator: async () => false,
    getPendingInvitations: async () => [],
    acceptInvitation: async () => false,
    getCandidateCount: async () => 0,
    refetch: async () => {},
  };
}