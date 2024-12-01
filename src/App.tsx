import React, { useState, useCallback, ChangeEvent, useEffect } from "react";
import Select from "react-select";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  FIXED_ACCOUNT: "hledger-fixed-account",
  HIGHLIGHTED_ACCOUNT: "hledger-highlighted-account",
};

const HledgerEditor: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [accountOptionsText, setAccountOptionsText] = useState<string>("");
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [journalCollapsed, setJournalCollapsed] = useState(false);
  const [accountsCollapsed, setAccountsCollapsed] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(false);
  const [fixedAccount, setFixedAccount] = useState<AccountOption | null>(null);
  const [highlightedAccount, setHighlightedAccount] =
    useState<AccountOption | null>(null);

  // Load saved data on component mount
  useEffect(() => {
    const savedTransactionsText = localStorage.getItem(
      STORAGE_KEYS.TRANSACTIONS_TEXT,
    );
    const savedAccountOptionsText = localStorage.getItem(
      STORAGE_KEYS.ACCOUNT_OPTIONS_TEXT,
    );
    const savedFixedAccount = localStorage.getItem(STORAGE_KEYS.FIXED_ACCOUNT);
    const savedHighlightedAccount = localStorage.getItem(
      STORAGE_KEYS.HIGHLIGHTED_ACCOUNT,
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

      if (savedFixedAccount) {
        const fixedOption = options.find(
          (opt) => opt.value === savedFixedAccount,
        );
        if (fixedOption) setFixedAccount(fixedOption);
      }

      if (savedHighlightedAccount) {
        const highlightOption = options.find(
          (opt) => opt.value === savedHighlightedAccount,
        );
        if (highlightOption) setHighlightedAccount(highlightOption);
      }
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

  const handleFixedAccountChange = (option: AccountOption | null) => {
    setFixedAccount(option);
    localStorage.setItem(STORAGE_KEYS.FIXED_ACCOUNT, option?.value || "");
  };

  const handleHighlightedAccountChange = (option: AccountOption | null) => {
    setHighlightedAccount(option);
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHTED_ACCOUNT, option?.value || "");
  };

  const sidePanelCollapsed =
    journalCollapsed && accountsCollapsed && configCollapsed;

  return (
    <div className="max-w-[1440px] mx-auto p-4 min-h-screen">
      <div className="relative h-10 mb-4">
        <h1 className="text-2xl font-bold fixed w-full">
          hledger Transaction Editor
        </h1>
      </div>
      <div
        className={`grid gap-10 ${sidePanelCollapsed ? "grid-cols-[200px_1fr]" : "grid-cols-2"}`}
      >
        <div>
          <div
            className={`fixed ${sidePanelCollapsed ? "w-[200px]" : "w-[40vw]"} h-[calc(100vh_-_80px)] overflow-auto space-y-4 px-2 pb-10`}
          >
            <div>
              <h2
                className="font-semibold mb-2 flex items-center cursor-pointer"
                onClick={() => setJournalCollapsed(!journalCollapsed)}
              >
                {journalCollapsed ? (
                  <ChevronRight className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                Transactions Journal
              </h2>
              {!journalCollapsed && (
                <textarea
                  className="w-full h-[40vh] font-mono text-sm p-2 border rounded"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Paste your hledger transactions journal file here"
                />
              )}
            </div>

            <div>
              <h2
                className="font-semibold mb-2 flex items-center cursor-pointer"
                onClick={() => setAccountsCollapsed(!accountsCollapsed)}
              >
                {accountsCollapsed ? (
                  <ChevronRight className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                Account Names
              </h2>
              {!accountsCollapsed && (
                <>
                  <p className="text-sm">
                    Run{" "}
                    <pre className="inline bg-gray-200 px-1">
                      hledger accounts | pbcopy
                    </pre>{" "}
                    to copy your accounts list
                  </p>
                  <textarea
                    className="w-full h-[40vh] font-mono text-sm p-2 border rounded"
                    value={accountOptionsText}
                    onChange={handleAccountOptionsChange}
                    placeholder="Paste your account names here (one per line)"
                  />
                </>
              )}
            </div>

            <div>
              <h2
                className="font-semibold mb-2 flex items-center cursor-pointer"
                onClick={() => setConfigCollapsed(!configCollapsed)}
              >
                {configCollapsed ? (
                  <ChevronRight className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                Config
              </h2>
              {!configCollapsed && (
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Fixed account
                    </label>
                    <Select
                      options={accountOptions}
                      value={fixedAccount}
                      onChange={handleFixedAccountChange}
                      isClearable={true}
                      placeholder="Select fixed account"
                      className="w-[340px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Highlight account
                    </label>
                    <Select
                      options={accountOptions}
                      value={highlightedAccount}
                      onChange={handleHighlightedAccountChange}
                      isClearable={true}
                      placeholder="Select highlight account"
                      className="w-[340px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <div
            className={`space-y-4 w-fit max-w-[800px] ${sidePanelCollapsed ? "mx-auto" : ""}`}
          >
            <h2 className="font-semibold mb-2">Transactions Editor</h2>
            {transactions.map((transaction, tIndex) => (
              <div key={tIndex} className="space-y-1 text-sm">
                <div className="font-semibold">{transaction.header}</div>
                {transaction.accounts.map((account, aIndex) => (
                  <div
                    key={aIndex}
                    className="flex items-center justify-between space-x-2 w-[420px]"
                  >
                    {fixedAccount?.value === account.account ? (
                      <span className="w-[340px] py-1">{account.account}</span>
                    ) : (
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
                            backgroundColor:
                              highlightedAccount?.value === account.account
                                ? "lightblue"
                                : baseStyles.backgroundColor,
                            borderColor:
                              highlightedAccount?.value === account.account
                                ? "black"
                                : baseStyles.borderColor,
                            borderWidth:
                              highlightedAccount?.value === account.account
                                ? "2px"
                                : baseStyles.borderWidth,
                          }),
                          dropdownIndicator: (baseStyles) => ({
                            ...baseStyles,
                            paddingTop: 0,
                            paddingBottom: 0,
                          }),
                        }}
                      />
                    )}
                    <span className="font-mono text-sm">{account.amount}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HledgerEditor;
