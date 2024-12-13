import React from "react";
import { useHistory } from "react-router-dom";
import { intersectionWith, isEqual } from "lodash";
import {
  useTable,
  usePagination,
  useSortBy,
  useFilters,
  useGlobalFilter,
  useExpanded,
} from "react-table";
import {
  DefaultColumnFilter,
  GlobalFilter,
  fuzzyTextFilterFn,
} from "../utils/Filters";
import { useAuth } from "../context/auth";
import { getLogQuery } from "./../queries/queries";
import { sortReshape, filterReshape } from "./../utils/reshapers";
import TableStyles from "./../stylesheets/table-styles";
import LogSubTable from "./LogSubTable";
import { handleErrors } from '../utils/messages';
/**
 * Provides the data needed to construct the LogTable using the Table function
 * @param {*} columns Each of the columns of the DataGrid
 * @param {*} data Data to be used in the table
 * @param {*} fetchData Collcts new data for the table 
 * @param {*} loading Loading indicator, a boolean
 * @param {controlledPageCount} pageCount Nummber of pages 
 * @param {*} renderRowSubComponent Renders a subcomponent for each row of the table
 * @param {*} setExpandAllChecked A boolean that checks for expanding the table
 * @returns A rendered LogTable
 */
function Table({
  columns,
  data,
  fetchData,
  loading,
  pageCount: controlledPageCount,
  renderRowSubComponent,
  setExpandAllChecked,
}) {
  const { user } = useAuth();

  const filterTypes = React.useMemo(
    () => ({
      fuzzyText: fuzzyTextFilterFn,
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  const defaultColumn = React.useMemo(
    () => ({
      Filter: DefaultColumnFilter, // Let's set up our default Filter UI
      minWidth: 25, // minWidth is only used as a limit for resizing
      width: 50, // width is used for both the flex-basis and flex-grow
      maxWidth: 500, // maxWidth is only used as a limit for resizing
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    rows,
    state,
    allColumns,
    setHiddenColumns,
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    toggleAllRowsExpanded,
    // Get the state from the instance
    state: { pageIndex, pageSize, sortBy, filters, globalFilter },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 }, // Pass our hoisted table state
      manualPagination: true, // Tell the usePagination
      // hook that we'll handle our own data fetching
      // This means we'll also have to provide our own
      // pageCount.
      pageCount: controlledPageCount,
      manualSortBy: true,
      manualFilters: true,
      manualGlobalFilter: true,
      defaultColumn,
      filterTypes,
      //hiddenColumns: columns.filter(column => !column.show).map(column => column.id),
      //   selectValues
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination
  );

  // Listen for changes in pagination and use the state to fetch our new data
  React.useEffect(() => {
    fetchData({
      pageIndex,
      pageSize,
      sortBy,
      filters,
      globalFilter,
      toggleAllRowsExpanded,
    });
  }, [
    fetchData,
    pageIndex,
    pageSize,
    sortBy,
    filters,
    globalFilter,
    toggleAllRowsExpanded,
  ]);

  React.useEffect(() => {
    setExpandAllChecked(true); 
    toggleAllRowsExpanded(true);
    setHiddenColumns(
      columns.filter((column) => column.hide).map((column) => column.id)
    );
  }, [columns, setHiddenColumns]);

  // Render the UI for your table
  // Originally an "Expand All" button, changed to "Collapse All"
  return (
    <>
      <div className="allExpandToggle" >
        <label>
          <input
            type="checkbox"
            onChange={(e) => {
              setExpandAllChecked(!e.target.checked);
              toggleAllRowsExpanded(!e.target.checked);
            }}
          />
          {" Collapse All"}
        </label>
      </div>
      <div className="columnToggle">
        {allColumns.map((column) =>
          column.label !== undefined ? (
            <div key={column.id} className="columnToggle">
              <label>
                <input type="checkbox" {...column.getToggleHiddenProps()} />{" "}
                {column.label}
              </label>
            </div>
          ) : null
        )}
      </div>
      <table {...getTableProps()}>
        <thead>
          <tr>
            <th colSpan={visibleColumns.length}>
              {user &&
                (user.roles.includes("update") ||
                  user.roles.includes("manager"))}
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            </th>
          </tr>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>
                  <span {...column.getSortByToggleProps()}>
                    {column.render("Header")}
                    {column.isSorted ? (column.isSortedDesc ? " ▼" : " ▲") : ""}
                  </span>
                  <div>{column.canFilter ? column.render("Filter") : null}</div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <React.Fragment key={row.getRowProps().key}>
                <tr>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}> {cell.render("Cell")} </td>
                    );
                  })}
                </tr>
                {row.isExpanded && (
                  <tr>
                    <td colSpan={visibleColumns.length}>
                      {renderRowSubComponent({ row })}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          <tr>
            {loading ? (
              // Use our custom loading state to show a loading indicator
              <td colSpan="10000">Loading...</td>
            ) : (
              <td colSpan="10000">
                Showing {page.length} of ~{controlledPageCount * pageSize}{" "}
                results
              </td>
            )}
          </tr>
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} aria-label={"First Page"}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage} aria-label={"Previous Page"}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage} aria-label={"Next Page"}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} aria-label={"Last Page"}>
          {">>"}
        </button>{" "}
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

/**
 * Provides the data needed to construct the LogTable using the Table function
 * @param {*} props Used to access properties of the Table as it is used (not used)
 * @returns A rendered LogTable
 */
function LogTable(props) {
  let history = useHistory();

  const updateColumns = React.useMemo(
    () => [
      {
        Header: "",
        id: "expander", // It needs an ID
        Cell: ({ row }) => (
          <span {...row.getToggleRowExpandedProps()}>
            {row.isExpanded ? "▼" : "▶"}
          </span>
        ),
      },
      {
        Header: "Action",
        accessor: "action",
        Filter: DefaultColumnFilter,
        tableName: "LogTable",
        id: "action",
        label: "action",
      },
      {
        Header: "Schema",
        accessor: "schema_name",
        Filter: DefaultColumnFilter,
        tableName: "LogTable",
        id: "schema_name",
        label: "schema",
      },
      {
        Header: "Table",
        accessor: "table_name",
        tableName: "LogTable",
        id: "table_name",
        label: "table",
      },
      {
        Header: "User",
        accessor: "audit_user[0].first",
        filter: "fuzzyText",
        tableName: "LogTable",
        id: "user",
        label: "user",
      },
    ],
    []
  );

  const renderRowSubComponent = React.useCallback(
    ({ row }) => (
      <div>
        <LogSubTable originalRow={row} />
      </div>
    ),
    []
  );

  // We'll start our table without any data
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [pageCount, setPageCount] = React.useState(0);
  const [expandAllChecked, setExpandAllChecked] = React.useState(false);
  const fetchIdRef = React.useRef(0);
  const { client, setAuthTokens, user } = useAuth();

  async function getLog(limit, offset, sortBy, filters) {
    let res = {};
    if (
      user &&
      intersectionWith(["manager", "update"], user.roles, isEqual).length >= 1
    ) {
      res = await client.query({
        query: getLogQuery,
        variables: {
          limit: limit,
          offset: offset,
          log_order: sortBy,
          where: filters,
        },
      });
    }
    return res.data;
  }

  const fetchData = React.useCallback(
    ({
      pageSize,
      pageIndex,
      sortBy,
      filters,
      globalFilter,
      toggleAllRowsExpanded,
    }) => {
      // This will get called when the table needs new data
      // You could fetch your data from literally anywhere,
      // even a server. But for this example, we'll just fake it.

      // Give this fetch an ID
      const fetchId = ++fetchIdRef.current;

      // Set the loading state
      setLoading(true);

      // We'll even set a delay to simulate a server here
      setTimeout(() => {
        // Only update the data if this is the latest fetch
        if (fetchId === fetchIdRef.current) {
          const controlledSort = sortReshape(sortBy, "event_id", "desc");
          const controlledFilter = filterReshape(filters, globalFilter, [
            "action",
            "table_name",
          ]);
          // // reset to first page when filters change
          getLog(
            pageSize,
            pageSize * pageIndex,
            controlledSort,
            controlledFilter
          )
            .then((data) => {
              console.log(data);
              let totalCount =
                data.audit_logged_actions_aggregate.aggregate.count;
              setData(data.audit_logged_actions);
              setPageCount(Math.ceil(totalCount / pageSize));
              setLoading(false);
              toggleAllRowsExpanded(expandAllChecked);
            })
            .catch((error) => {
              console.log(error);
              handleErrors(error, {
                logout: { action: setAuthTokens, redirect: "/login" },
              });
              setData([]);
              setPageCount(0);
              setLoading(false);
              history.push("./login");
            });
        }
      }, 1000);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [history, setAuthTokens, expandAllChecked]
  );

  let columns = updateColumns;

  return (
    <TableStyles>
      <Table
        columns={columns}
        data={data}
        renderRowSubComponent={renderRowSubComponent}
        fetchData={fetchData}
        loading={loading}
        pageCount={pageCount}
        // selectValues={props.selectValues}
        setExpandAllChecked={setExpandAllChecked}
      />
    </TableStyles>
  );
}

export default LogTable;
