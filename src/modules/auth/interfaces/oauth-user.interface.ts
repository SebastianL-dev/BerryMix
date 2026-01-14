export default interface OAuthUser {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}
