import React, { useState, useCallback, ChangeEvent, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Select from "react-select";

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

interface AccountOption {
  value: string;
  label: string;
}

// Storage keys
const STORAGE_KEYS = {
  TRANSACTIONS_TEXT: "hledger-transactions-text",
  ACCOUNT_OPTIONS_TEXT: "hledger-account-options-text",
};

const HledgerEditor: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [accountOptionsText, setAccountOptionsText] = useState<string>("");
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);

  // Load saved data on component mount
  useEffect(() => {
    const savedTransactionsText = localStorage.getItem(
      STORAGE_KEYS.TRANSACTIONS_TEXT,
    );
    const savedAccountOptionsText = localStorage.getItem(
      STORAGE_KEYS.ACCOUNT_OPTIONS_TEXT,
    );

    if (savedTransactionsText) {
      setInputText(savedTransactionsText);
      setTransactions(parseTransactions(savedTransactionsText));
    }

    if (savedAccountOptionsText) {
      setAccountOptionsText(savedAccountOptionsText);
      // Split by newlines and filter out empty lines
      const options = savedAccountOptionsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => ({ value: line, label: line }));
      setAccountOptions(options);
    }
  }, []);

  // Parse account options from textarea
  const handleAccountOptionsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAccountOptionsText(text);
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_OPTIONS_TEXT, text);

    // Split by newlines and filter out empty lines
    const options = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({ value: line, label: line }));
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
    selectedOption: AccountOption | null,
  ) => {
    if (!selectedOption) return;

    const updatedTransactions = [...transactions];
    updatedTransactions[transactionIndex].accounts[accountIndex].account =
      selectedOption.value;
    setTransactions(updatedTransactions);

    // Update the input text
    const lines = inputText.split("\n");
    const transaction = updatedTransactions[transactionIndex];
    const accountLine = transaction.accounts[accountIndex];
    const spacesMatch = lines[accountLine.line].match(/^\s+/);
    const spaces = spacesMatch ? spacesMatch[0] : "    ";
    lines[accountLine.line] = `${spaces}${selectedOption.value}${" ".repeat(
      Math.max(2, 30 - selectedOption.value.length),
    )}${accountLine.amount}`;
    const newText = lines.join("\n");
    setInputText(newText);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_TEXT, newText);
  };

  // Handle input text changes
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_TEXT, newText);
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
            <div className="space-y-4 overflow-auto h-[82vh] text-sm">
              {transactions.map((transaction, tIndex) => (
                <div key={tIndex} className="border rounded p-4 space-y-2">
                  <div className="font-semibold">{transaction.header}</div>
                  {transaction.accounts.map((account, aIndex) => (
                    <div
                      key={aIndex}
                      className="flex items-center justify-between space-x-2 w-[420px]"
                    >
                      <Select
                        options={accountOptions}
                        value={accountOptions.find(
                          (option) => option.value === account.account,
                        )}
                        onChange={(option) =>
                          updateAccount(tIndex, aIndex, option)
                        }
                        placeholder="Select account"
                        className="w-[340px]"
                        styles={{
                          control: (baseStyles) => ({
                            ...baseStyles,
                            minHeight: "unset",
                          }),
                          dropdownIndicator: (baseStyles) => ({
                            ...baseStyles,
                            paddingTop: 0,
                            paddingBottom: 0,
                          }),
                        }}
                      />
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
