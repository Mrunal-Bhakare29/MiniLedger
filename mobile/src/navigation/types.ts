import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Otp: { phone: string; resendSeconds: number; mockOtp?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Overview: undefined;
  AddLoan: undefined;
  Profile: undefined;
  Loans?: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  LoanDetails: { loanId: string };
  AddLoan: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}
