// Ligne brute telle que stockée en base (ingredients/steps en JSON string).
export type Recipe = {
  id: number;
  title: string;
  category: string;
  tags: string;
  prep_time: string;
  difficulty: string;
  ingredients: string;
  steps: string;
  submitter_name: string;
  photo_filename: string | null;
  validated: number;
  created_at: string;
};

export type RecipeInput = {
  id?: number;
  title: string;
  category: string;
  tags: string;
  prep_time: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  submitter_name: string;
  photo_filename: string | null;
  validated: boolean;
  created_at?: string;
};
