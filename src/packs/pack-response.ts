export type PackResponse = {
  id: string;
  packName: string;
  active: boolean;
  price: number;
  content: string[];
  childPackIds: string[];
};
