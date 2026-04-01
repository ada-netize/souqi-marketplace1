import React from "react";

export const AuthContext = React.createContext(null);

export function useApp() {
  return React.useContext(AuthContext);
}
