export default interface AuthUser {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}
