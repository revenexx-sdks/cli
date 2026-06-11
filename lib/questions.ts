import chalk from "chalk";
import { globalConfig } from "./config.js";
import { validateRequired } from "./validations.js";

interface Choice {
  name: string;
  value: any;
  disabled?: boolean | string;
  current?: boolean;
  short?: string;
}

interface Question {
  type: string;
  name: string;
  message: string;
  default?: any;
  choices?:
    | (() => Promise<Choice[]> | Choice[])
    | Choice[]
    | string[];
  validate?: (value: any) => boolean | string | Promise<boolean | string>;
  mask?: string;
}

export const questionsLogout: Question[] = [
  {
    type: "checkbox",
    name: "accounts",
    message: "Select accounts to logout from",
    validate: (value: any) => validateRequired("account", value),
    choices() {
      const sessions = globalConfig.getSessions();
      const current = globalConfig.getCurrentSession();

      const data: Choice[] = [];

      const longestEmail = sessions.reduce((prev: any, current: any) =>
        prev && (prev.email ?? "").length > (current.email ?? "").length
          ? prev
          : current,
      ).email.length;

      sessions.forEach((session: any) => {
        if (session.email) {
          data.push({
            current: current === session.id,
            value: session.id,
            name: `${session.email.padEnd(longestEmail)} ${current === session.id ? chalk.green.bold("current") : " ".repeat(6)} ${session.endpoint}`,
          });
        }
      });

      return data.sort((a, b) => Number(b.current) - Number(a.current));
    },
  },
];
