import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const HledgerEditor = () => {
  const [transactions, setTransactions] = useState([]);
  const [inputText, setInputText] = useState("");

  // Account options for the dropdown
  const accountOptions = [
    "assets:bank:dbs:mca",
    "assets:bank:dbs:multiplier",
    "assets:bank:dbs:paylah",
    "assets:bank:dbs:savings",
    "assets:bank:stanchart",
    "assets:bank:youtrip",
    "assets:broker:ibkr",
    "assets:cash",
    "assets:cpf:ma",
    "assets:cpf:oa",
    "assets:cpf:sa",
    "assets:receivables",
    "assets:receivables:handshakes",
    "assets:receivables:simin",
    "equity:conversion",
    "equity:dbs:rsp:nikkoAM",
    "equity:insurance:ge:wealthplan",
    "equity:openingbalances",
    "expenses:2024nz",
    "expenses:cartograph",
    "expenses:eatingout",
    "expenses:fees:dbsvickers",
    "expenses:fees:late",
    "expenses:food:dailymeals",
    "expenses:food:drinks",
    "expenses:food:eatingout",
    "expenses:food:eatingout:family",
    "expenses:food:eatingout:friends",
    "expenses:food:groceries",
    "expenses:food:groceries:tea",
    "expenses:food:officelunch",
    "expenses:food:orderin",
    "expenses:food:snacks",
    "expenses:gift",
    "expenses:gift:treat",
    "expenses:health:dental",
    "expenses:health:doctor",
    "expenses:health:fitness",
    "expenses:health:grooming",
    "expenses:health:medicine",
    "expenses:health:wellness",
    "expenses:house",
    "expenses:house:consummables",
    "expenses:house:diy",
    "expenses:house:equipment",
    "expenses:house:fittings",
    "expenses:house:furniture",
    "expenses:house:other",
    "expenses:house:reno",
    "expenses:house:things",
    "expenses:house:toiletries",
    "expenses:house:utilities",
    "expenses:house:utilities:mobile",
    "expenses:house:utilities:towncouncil",
    "expenses:insurance",
    "expenses:leisure",
    "expenses:leisure:books",
    "expenses:leisure:sports",
    "expenses:misc",
    "expenses:misc:fees",
    "expenses:other",
    "expenses:parents",
    "expenses:selfdevelopment",
    "expenses:shopping:clothes",
    "expenses:shopping:electronics",
    "expenses:shopping:hobbies",
    "expenses:shopping:other",
    "expenses:tax:incometax",
    "expenses:tax:property",
    "expenses:transport:bike",
    "expenses:transport:cab",
    "expenses:transport:carsharing",
    "expenses:transport:ezlink",
    "expenses:transport:taxi",
    "expenses:travel:2024india",
    "expenses:travel:2024india:insurance",
    "expenses:travel:2024maldives:flight",
    "expenses:travel:2024maldives:insurance",
    "expenses:travel:2024ny",
    "expenses:travel:2024nz",
    "expenses:travel:2024sumatra",
    "expenses:uncat",
    "expenses:wedding",
    "expenses:work",
    "income:dividends:cdp:cict",
    "income:dividends:cdp:zheneng",
    "income:dividends:dbsrsp",
    "income:dividends:dbsvickers",
    "income:gift:wedding",
    "income:interest:dbs",
    "income:misc",
    "income:salary:vmware",
    "income:salary:vmware:rsu",
    "liabilities:creditcard:citicashback",
    "liabilities:creditcard:citiprestige",
    "liabilities:creditcard:dbsaltitude",
    "liabilities:creditcard:hsbcrevo",
    "temp:bank:stanchart",
    "temp:creditcard:citicashback",
    "temp:creditcard:citiprestige",
    "temp:creditcard:dbsaltitude",
    "temp:creditcard:hsbcrevo",
    "temp:debitcard:youtrip",
  ];

  // Parse the input text into structured transactions
  const parseTransactions = useCallback((text) => {
    const lines = text.split("\n");
    const parsedTransactions = [];
    let currentTransaction = null;

    lines.forEach((line, index) => {
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
  const updateAccount = (transactionIndex, accountIndex, newAccount) => {
    const updatedTransactions = [...transactions];
    updatedTransactions[transactionIndex].accounts[accountIndex].account =
      newAccount;
    setTransactions(updatedTransactions);

    // Update the input text
    const lines = inputText.split("\n");
    const transaction = updatedTransactions[transactionIndex];
    const accountLine = transaction.accounts[accountIndex];
    const spaces = lines[accountLine.line].match(/^\s+/)[0];
    lines[accountLine.line] =
      `${spaces}${newAccount}${" ".repeat(Math.max(0, 30 - newAccount.length))}${accountLine.amount}`;
    setInputText(lines.join("\n"));
  };

  // Handle input text changes
  const handleInputChange = (e) => {
    const newText = e.target.value;
    setInputText(newText);
    setTransactions(parseTransactions(newText));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>hledger Transaction Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <textarea
                className="w-full h-96 font-mono text-sm p-2 border rounded"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Paste your hledger transactions here..."
              />
            </div>
            <div className="space-y-4 overflow-auto h-96">
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
