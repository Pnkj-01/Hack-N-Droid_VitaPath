export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
      };
      safety_alerts: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          type: 'emergency' | 'warning' | 'info';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          type: 'emergency' | 'warning' | 'info';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          type?: 'emergency' | 'warning' | 'info';
          created_at?: string;
        };
      };
    };
  };
} 