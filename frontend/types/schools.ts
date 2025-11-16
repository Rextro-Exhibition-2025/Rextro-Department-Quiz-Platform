type Member = {
  name: string;
  marks: number;
  isLoggedIn: boolean;
  _id: string;
  authToken?: string;
};

export type SchoolTeam = {
  _id: string;
  teamName: string;
  schoolName: string;
  password: string;
  totalMarks: number;
  members: Member[];
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type SchoolsApiResponse = {
  success: boolean;
  count: number;
  data: SchoolTeam[];
};