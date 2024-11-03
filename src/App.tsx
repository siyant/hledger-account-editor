import React, { useState, useCallback, ChangeEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Account {
  account: string;
  amount: string;
  line: number;
}

interface Transaction {
  header: string;
  accounts: Account[];
  startLine: number;
}

const HledgerEditor: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [accountOptionsText, setAccountOptionsText] = useState<string>("");
  const [accountOptions, setAccountOptions] = useState<string[]>([]);

  // Parse account options from textarea
  const handleAccountOptionsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAccountOptionsText(text);
    // Split by newlines and filter out empty lines
    const options = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setAccountOptions(options);
  };

  // Parse the input text into structured transactions
  const parseTransactions = useCallback((text: string): Transaction[] => {
    const lines = text.split("\n");
    const parsedTransactions: Transaction[] = [];
    let currentTransaction: Transaction | null = null;

    lines.forEach((line: string, index: number) => {
      const trimmedLine = line.trim();

      if (trimmedLine === "") {
        if (currentTransaction) {
          parsedTransactions.push(currentTransaction);
          currentTransaction = null;
        }
        return;
      }

      if (!line.startsWith(" ") && !line.startsWith("\t")) {
        if (currentTransaction) {
          parsedTransactions.push(currentTransaction);
        }
        currentTransaction = {
          header: trimmedLine,
          accounts: [],
          startLine: index,
        };
      } else if (currentTransaction) {
        const accountMatch = line.match(/^\s+([^$]+)\s+(\$[+-]?\d+\.\d+)/);
        if (accountMatch) {
          currentTransaction.accounts.push({
            account: accountMatch[1].trim(),
            amount: accountMatch[2],
            line: index,
          });
        }
      }
    });

    if (currentTransaction) {
      parsedTransactions.push(currentTransaction);
    }

    return parsedTransactions;
  }, []);

  // Update the account for a specific transaction
  const updateAccount = (
    transactionIndex: number,
    accountIndex: number,
    newAccount: string,
  ) => {
    const updatedTransactions = [...transactions];
    updatedTransactions[transactionIndex].accounts[accountIndex].account =
      newAccount;
    setTransactions(updatedTransactions);

    // Update the input text
    const lines = inputText.split("\n");
    const transaction = updatedTransactions[transactionIndex];
    const accountLine = transaction.accounts[accountIndex];
    const spacesMatch = lines[accountLine.line].match(/^\s+/);
    const spaces = spacesMatch ? spacesMatch[0] : "    ";
    lines[accountLine.line] = `${spaces}${newAccount}${" ".repeat(
      Math.max(0, 30 - newAccount.length),
    )}${accountLine.amount}`;
    setInputText(lines.join("\n"));
  };

  // Handle input text changes
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    setTransactions(parseTransactions(newText));
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 min-h-screen">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>hledger Transaction Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <textarea
                className="w-full h-[40vh] font-mono text-sm p-2 border rounded"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Paste your hledger transactions here..."
              />
              <textarea
                className="w-full h-[40vh] font-mono text-sm p-2 border rounded"
                value={accountOptionsText}
                onChange={handleAccountOptionsChange}
                placeholder="Paste your account names here (one per line)..."
              />
            </div>
            <div className="space-y-4 overflow-auto h-[82vh]">
              {transactions.map((transaction, tIndex) => (
                <div key={tIndex} className="border rounded p-4 space-y-2">
                  <div className="font-mono text-sm">{transaction.header}</div>
                  {transaction.accounts.map((account, aIndex) => (
                    <div key={aIndex} className="flex items-center space-x-2">
                      <select
                        className="flex-1 p-1 text-sm border rounded"
                        value={account.account}
                        onChange={(e) =>
                          updateAccount(tIndex, aIndex, e.target.value)
                        }
                      >
                        {accountOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <span className="font-mono text-sm">
                        {account.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HledgerEditor;
