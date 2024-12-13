import React from "react";
import { useHistory } from "react-router-dom";
import { useTable } from "react-table";
import { formatCellValue } from "../utils/helpers";
import { getRowHistoryQuery } from "./../queries/queries";
import { useAuth } from "../context/auth";

// These are rows with PKs other than just {id} or {}.  Add them here as they're added.
const specialRowPKs = {
  public: {
    user_roles: ["roleId", "userId"],
  },
  audit: {
    logged_actions: ['event_id'],  // Oh god, hopefully nobody audits changes to the audits
  }
}

/**
 * This function constructs a table used for displaying text data provided by the LogSubTable function.
 * @param {*} columns Each of the columns of the DataGrid
 * @param {*} data Data to be used in the table
 * @param {*} fetchData Collcts new data for the table 
 * @param {*} loading Loading indicator, a boolean
 * @param {*} getCellProps modifies individual cells
 * @returns A rendered UI for the table
 */
function Table({ columns, data, fetchData, getCellProps }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setHiddenColumns,
  } = useTable({ columns, data, getCellProps });

  // I don't know enough about React to know if this is necessary,
  //  but I'm too scared to deal with async stuff in a different way
  React.useEffect(() => {
    fetchData({});
  });

  React.useEffect(() => {
    setHiddenColumns(
      columns.filter((column) => column.hide).map((column) => column.id)
    );
  }, [setHiddenColumns, columns]);

  // Render the UI for your table
  return (
    <React.Fragment>
      <table className="logSubTable" {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <React.Fragment key={row.getRowProps().key}>
                <tr>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps([getCellProps(cell)])}>
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </React.Fragment>
  );
}
/**
 * Provides the data needed to construct the LogSubTable using the Table function
 * @param {*} originalRow A row from the LogTable
 * @returns A rendered LogSubTable
 */
function LogSubTable({ originalRow }) {
  let history = useHistory();

  function getCellProps(cell) {
    var header = cell.column.key;
    var modifiedRows = cell.row.original.changed_fields;

    var isChanged = modifiedRows !== null && header in modifiedRows;
    var isCurRow = cell.row.original.event_id === originalRow.original.event_id;

    if (isChanged && isCurRow) return { bgcolor: "#5adb8c" };
    if (isChanged) return { bgcolor: "#5e97e0" };
    if (isCurRow) return { bgcolor: "#daf4e4" };
    return {};
  }

  const columns = React.useMemo(
    () => [
      {
        Header: "Action",
        id: "action",
        accessor: "action",
        Cell: ({ value, row }) =>
          value === "U" && row.original.changed_fields === null ? "X" : value,
      },
      {
        Header: "Actor",
        id: "user",
        accessor: (row) => row.audit_user[0]?.first ?? "N/A",
      },
      ...Object.keys(originalRow.original.row_data).filter((key) => 
        !["id", "password", "username", "email", "actor"].includes(key)).map((key) => ({
        Header: key,
        key: key,
        id: "rd_" + key,
        accessor: (row) =>
          key in row.row_data
            ? row.changed_fields?.[key] || row.row_data[key]
            : "N/A (COLUMN DOES NOT EXIST)",
        Cell: ({ value }) => formatCellValue(value),
      })),
    ],
    [originalRow]
  );

  const [data, setData] = React.useState([]);
  const { client } = useAuth();

  const fetchData = React.useCallback(() => {
    (async function () {
      const values = originalRow.original;

      // The PK isn't simply {id} for all tables.  This will special case some.
      const wherePK = {};
      for (var PK of specialRowPKs[values.schema_name][values.table_name] ?? [
        "id",
      ]) {
        wherePK[PK] = values.row_data[PK];
      }

      var res = await client.query({
        query: getRowHistoryQuery,
        variables: {
          row_contains: wherePK,
          table_name: values.table_name,
        },
      });
      return res.data;
    })().then((data) => {
      console.log(data);
      setData(data.audit_logged_actions);
    });
  });

  return (
    <Table
      columns={columns}
      data={data}
      fetchData={fetchData}
      getCellProps={getCellProps}
    />
  );
}

export default LogSubTable;
